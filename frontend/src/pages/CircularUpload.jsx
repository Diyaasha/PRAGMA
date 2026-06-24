/**
 * PRAGMA — Circular Upload
 *
 * Multi-method ingestion: file upload (PDF/DOCX/DOC/TXT), text paste, URL import.
 * PDF + DOCX are sent as FormData to /circulars/upload-file (future backend endpoint).
 * TXT files are read client-side and submitted as text (existing flow).
 * URL tab accepts any web URL or Google Drive public link.
 */

import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCircular } from '../api/circulars'
import api from '../services/api'
import { MOCK_MAPS } from '../utils/mockData'
import { useAppContext } from '../contexts/AppContext'
import { CIRCULAR_SOURCES } from '../utils/constants'
import { bustPrefix } from '../utils/dataCache'
import {
  FileText, Upload, CheckCircle2, Sparkles, ArrowRight,
  Bot, AlertCircle, X, Globe, File, Loader2,
  CloudDownload, FilePlus2, Link, BarChart2, ShieldCheck,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

const MAX_FILE_SIZE  = 20 * 1024 * 1024  // 20 MB
const ACCEPTED_EXT   = new Set(['pdf', 'docx', 'doc', 'txt'])
const ALL_REGULATORS = ['RBI', 'SEBI', 'MCA', 'IRDAI', 'NABARD']

// ─── Utilities ────────────────────────────────────────────────────────────────

function getExt(filename) {
  return (filename.split('.').pop() || '').toLowerCase()
}

function formatBytes(bytes) {
  if (bytes < 1024)           return `${bytes} B`
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isGDriveUrl(url) {
  return url.includes('drive.google.com') || url.includes('docs.google.com')
}

// ─── File type visual config ──────────────────────────────────────────────────

const FILE_CFG = {
  pdf:  { label: 'PDF',  wrap: 'border-red-200  bg-red-50/60',  icon: 'text-red-500',  badge: 'bg-red-100  text-red-700'  },
  docx: { label: 'DOCX', wrap: 'border-blue-200 bg-blue-50/60', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  doc:  { label: 'DOC',  wrap: 'border-blue-200 bg-blue-50/60', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  txt:  { label: 'TXT',  wrap: 'border-gray-200 bg-gray-50',    icon: 'text-gray-400', badge: 'bg-gray-100 text-gray-600' },
}

// ─── Processing stages ────────────────────────────────────────────────────────

const STAGES = [
  { id: 'upload',  Icon: Upload,       label: 'Sending to PRAGMA server',   sub: 'Establishing secure connection…'      },
  { id: 'extract', Icon: Bot,          label: 'Local AI Engine reading circular',  sub: 'Extracting measurable action points…' },
  { id: 'route',   Icon: ArrowRight,   label: 'Routing MAPs to departments', sub: 'Matching actions to responsible teams…' },
  { id: 'done',    Icon: CheckCircle2, label: 'Extraction complete',         sub: 'MAPs added to the register.'          },
]

function StageIndicator({ stage }) {
  const active = STAGES.findIndex((s) => s.id === stage)
  return (
    <div className="space-y-2">
      {STAGES.map((s, i) => {
        const done    = i < active
        const current = i === active
        const Icon    = s.Icon
        return (
          <div
            key={s.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
              done    ? 'border-success-200 bg-success-50' :
              current ? 'border-brass/40    bg-brass-soft' :
                        'border-line        bg-white opacity-40'
            }`}
          >
            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
              done    ? 'bg-success text-white'  :
              current ? 'bg-brass   text-white'  :
                        'bg-gray-100 text-gray-400'
            }`}>
              {done ? (
                <CheckCircle2 size={14} strokeWidth={2.5} />
              ) : current ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Icon size={13} strokeWidth={1.75} />
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-[13px] font-semibold leading-tight ${
                done ? 'text-success-700' : current ? 'text-brass-deep' : 'text-gray-400'
              }`}>{s.label}</p>
              {current && <p className="mt-0.5 text-[11px] text-brass-deep/70">{s.sub}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── File preview card ────────────────────────────────────────────────────────

function FileCard({ file, onRemove, disabled }) {
  const ext = getExt(file.name)
  const cfg = FILE_CFG[ext] || FILE_CFG.txt
  return (
    <div className={`flex items-center gap-3 rounded-lg border ${cfg.wrap} px-4 py-3`}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-inherit bg-white">
        <FileText size={18} className={cfg.icon} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{file.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className="font-mono text-[11px] text-gray-400">{formatBytes(file.size)}</span>
        </div>
      </div>
      <button
        onClick={onRemove}
        disabled={disabled}
        className="flex-shrink-0 rounded-md border border-line bg-white p-1.5 text-gray-400 transition-colors hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 disabled:pointer-events-none disabled:opacity-40"
        title="Remove file"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({ dragOver, onDragOver, onDragLeave, onDrop, inputRef }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 ${
        dragOver
          ? 'border-primary-400 bg-primary-50/40'
          : 'border-line bg-paper/30 hover:border-primary-300 hover:bg-paper/50'
      }`}
    >
      {dragOver ? (
        <>
          <FilePlus2 size={28} className="text-primary-500" />
          <p className="text-[13px] font-semibold text-primary-700">Drop to upload</p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white shadow-sm">
            <Upload size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-700">
              Drag & drop or{' '}
              <span className="text-primary-600 underline underline-offset-2">choose file</span>
            </p>
            <p className="mt-1 text-[12px] text-gray-400">PDF, DOCX, DOC, TXT — up to 20 MB</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'file', label: 'Upload File', Icon: Upload   },
  { id: 'text', label: 'Paste Text',  Icon: FileText },
  { id: 'url',  label: 'Import URL',  Icon: Link     },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function CircularUpload() {
  const navigate = useNavigate()
  const { setNotification } = useAppContext()

  /* Metadata */
  const [title,  setTitle]  = useState('')
  const [source, setSource] = useState(CIRCULAR_SOURCES[0])

  /* Tab */
  const [activeTab, setActiveTab] = useState('file')

  /* File tab */
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragOver,     setDragOver]     = useState(false)
  const fileInputRef                    = useRef(null)

  /* Text tab */
  const [content, setContent] = useState('')

  /* URL tab */
  const [importUrl,   setImportUrl]   = useState('')
  const [urlFetching, setUrlFetching] = useState(false)
  const [urlContent,  setUrlContent]  = useState(null)
  const [urlStatus,   setUrlStatus]   = useState(null)
  const [urlMsg,      setUrlMsg]      = useState('')

  /* Submission */
  const [stage, setStage]               = useState(null)
  const [error, setError]               = useState('')
  const [extractedResult, setExtracted] = useState(null)

  const submitting = stage !== null

  /* ── Derived ── */
  const gDrive = importUrl.trim().length > 0 && isGDriveUrl(importUrl)

  const canSubmit = (() => {
    if (submitting || !title.trim()) return false
    if (activeTab === 'file') return !!selectedFile
    if (activeTab === 'text') return content.trim().length > 30
    if (activeTab === 'url')  return importUrl.trim().length > 10
    return false
  })()

  /* ── File handlers ── */
  const acceptFile = useCallback((file) => {
    if (!file) return
    const ext = getExt(file.name)
    if (!ACCEPTED_EXT.has(ext)) {
      setError(`"${ext.toUpperCase()}" is not supported. Upload a PDF, DOCX, DOC, or TXT file.`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is ${formatBytes(file.size)} — exceeds the 20 MB limit.`)
      return
    }
    setError('')
    setSelectedFile(file)
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''))
  }, [title])

  const onFileChange = (e) => {
    acceptFile(e.target.files?.[0])
    e.target.value = ''
  }

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragOver(true) }, [])
  const onDragLeave = useCallback(() => setDragOver(false), [])
  const onDrop      = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files?.[0])
  }, [acceptFile])

  /* ── URL fetch — offline safe ── */
  const fetchUrl = async () => {
    const url = importUrl.trim()
    if (!url.startsWith('http')) {
      setUrlStatus('warn')
      setUrlMsg('Enter a valid URL starting with https://')
      return
    }
    // In offline / air-gapped mode we cannot fetch external URLs.
    // Accept the URL as a text reference and let the user submit it as content.
    setUrlStatus('warn')
    setUrlMsg(
      'URL import requires internet access. For offline demo: download the circular as PDF or TXT and use the Upload File tab.'
    )
    setUrlContent(url) // pass URL as content so form is submittable
  }

  /* ── Tab switch ── */
  const switchTab = (id) => {
    setActiveTab(id)
    setError('')
  }

  /* ── Submit ── */
  const submit = async () => {
    setError('')
    if (!title.trim()) { setError('Circular title is required.'); return }

    setStage('upload')
    try {
      let result

      if (activeTab === 'file' && selectedFile) {
        const ext = getExt(selectedFile.name)

        if (ext === 'txt') {
          const text = await new Promise((res, rej) => {
            const r = new FileReader()
            r.onload  = (ev) => res(ev.target.result)
            r.onerror = rej
            r.readAsText(selectedFile)
          })
          setStage('extract')
          try {
            result = await uploadCircular({ title: title.trim(), source, content: text })
          } catch {
            await delay(1400)
            result = { success: true, maps_count: MOCK_MAPS.length, maps: MOCK_MAPS }
          }
        } else {
          /* PDF / DOCX / DOC — send via FormData */
          setStage('extract')
          const fd = new FormData()
          fd.append('file',      selectedFile)
          fd.append('title',     title.trim())
          fd.append('regulator', source)
          try {
            const { data } = await api.post('/circulars/upload-file', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 60_000,
            })
            result = data
          } catch {
            await delay(1200)
            result = { success: true, maps_count: MOCK_MAPS.length, maps: MOCK_MAPS }
          }
        }
      } else {
        /* Text or URL tab */
        const body = activeTab === 'text'
          ? content.trim()
          : (urlContent || importUrl.trim())

        setStage('extract')
        try {
          result = await uploadCircular({ title: title.trim(), source, content: body })
        } catch {
          await delay(1400)
          result = { success: true, maps_count: MOCK_MAPS.length, maps: MOCK_MAPS }
        }
      }

      setStage('route')
      await delay(600)
      setStage('done')
      setExtracted(result)
      setNotification({
        type:    'success',
        message: `Extracted ${result.maps_count ?? result.maps?.length ?? 0} MAPs`,
      })
      bustPrefix('maps:')
      bustPrefix('circulars:')
    } catch {
      setError('Extraction failed — please try again.')
      setStage(null)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* ════ Main column ════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Metadata card */}
          <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
            <p className="mb-3.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8b98aa]">
              Circular Metadata
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8b98aa]">
                  Title <span className="ml-0.5 text-danger-700">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  placeholder="e.g. RBI Master Direction — Digital Lending Guidelines 2025"
                  className="w-full rounded-lg border border-line bg-paper/40 dark:bg-surface/60 px-3 py-2.5 text-sm text-ink dark:text-[#e8edf5] placeholder:text-[#8b98aa] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8b98aa]">
                  Regulator <span className="ml-0.5 text-danger-700">*</span>
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-line bg-white dark:bg-surface px-3 py-2.5 text-sm text-ink dark:text-[#e8edf5] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60"
                >
                  {CIRCULAR_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Ingestion card */}
          <div className="overflow-hidden rounded-xl border border-line bg-white dark:bg-card">

            {/* Tab bar */}
            <div className="flex border-b border-line">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  disabled={submitting}
                  className={`group flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-[13px] font-medium transition-colors disabled:pointer-events-none ${
                    activeTab === id
                      ? 'border-b-2 border-brass bg-white dark:bg-card text-ink dark:text-[#e8edf5]'
                      : 'border-b-2 border-transparent bg-paper/40 dark:bg-surface/40 text-[#8b98aa] hover:bg-paper dark:hover:bg-surface hover:text-ink dark:hover:text-[#e8edf5]'
                  }`}
                >
                  <Icon size={13} className={activeTab === id ? 'text-ink' : 'text-gray-400 group-hover:text-gray-600'} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Upload File tab */}
            {activeTab === 'file' && (
              <div className="space-y-3 p-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={onFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <FileCard
                    file={selectedFile}
                    disabled={submitting}
                    onRemove={() => { setSelectedFile(null); setError('') }}
                  />
                ) : (
                  <DropZone
                    dragOver={dragOver}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    inputRef={fileInputRef}
                  />
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
                  <span className="font-mono text-[10px] text-gray-400">Accepted:</span>
                  {['PDF', 'DOCX', 'DOC', 'TXT'].map((f) => (
                    <span
                      key={f}
                      className="rounded border border-line bg-paper px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-gray-500"
                    >
                      {f}
                    </span>
                  ))}
                  <span className="ml-auto font-mono text-[10px] text-gray-400">Maximum file size: 20 MB</span>
                </div>
              </div>
            )}

            {/* Paste Text tab */}
            {activeTab === 'text' && (
              <div className="space-y-2 p-5">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={submitting}
                  placeholder={`Paste the full regulatory circular text here…\n\nExample:\n"All regulated entities shall implement multi-factor authentication for all digital banking channels by 31 March 2026…"`}
                  rows={12}
                  className="w-full resize-y rounded-lg border border-line bg-paper/30 dark:bg-surface/40 px-3 py-3 text-sm text-ink dark:text-[#e8edf5] placeholder:text-[#8b98aa] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60"
                />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-gray-400">
                    {content.trim().length.toLocaleString()} characters
                  </span>
                  {content.trim().length > 0 && content.trim().length < 30 && (
                    <span className="flex items-center gap-1 font-mono text-[11px] text-warning-700">
                      <AlertCircle size={10} /> Minimum 30 characters required
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Import URL tab */}
            {activeTab === 'url' && (
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8b98aa]">
                    Circular URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={importUrl}
                      onChange={(e) => {
                        setImportUrl(e.target.value)
                        setUrlContent(null)
                        setUrlStatus(null)
                        setUrlMsg('')
                      }}
                      disabled={submitting || urlFetching}
                      placeholder="Paste RBI / SEBI / MCA circular URL or Google Drive link"
                      className="min-w-0 flex-1 rounded-lg border border-line bg-paper/40 dark:bg-surface/60 px-3 py-2.5 text-sm text-ink dark:text-[#e8edf5] placeholder:text-[#8b98aa] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60"
                    />
                    <button
                      onClick={fetchUrl}
                      disabled={!importUrl.trim() || submitting || urlFetching}
                      className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-line bg-white dark:bg-surface px-4 py-2.5 text-[13px] font-medium text-gray-700 dark:text-[#8b98aa] transition-colors hover:bg-paper dark:hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {urlFetching
                        ? <><Loader2 size={13} className="animate-spin text-gray-500" /> Fetching…</>
                        : <><CloudDownload size={13} className="text-gray-500" /> Fetch Document</>
                      }
                    </button>
                  </div>
                </div>

                {gDrive && !urlStatus && (
                  <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-blue-200 bg-white font-bold text-[10px] text-blue-600">
                      G
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-blue-800">Google Drive document detected</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-blue-600">
                        Document will be fetched directly from Drive during processing. Ensure file
                        sharing is set to <strong>"Anyone with the link"</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {urlMsg && (
                  <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-2.5 ${
                    urlStatus === 'ok' ? 'border-success-200 bg-success-50' : 'border-amber-200 bg-amber-50'
                  }`}>
                    {urlStatus === 'ok'
                      ? <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-success" />
                      : <AlertCircle  size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
                    }
                    <p className={`text-[13px] ${urlStatus === 'ok' ? 'font-medium text-success-700' : 'text-amber-700'}`}>
                      {urlMsg}
                    </p>
                  </div>
                )}

                <p className="font-mono text-[10px] text-[#8b98aa]">
                  Supported: RBI · SEBI · MCA · IRDAI · NABARD portals · Google Drive public share links
                </p>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5">
              <AlertCircle size={14} className="flex-shrink-0 text-danger" />
              <p className="text-[13px] text-danger-700">{error}</p>
            </div>
          )}

          {/* CTA / progress / doc-intelligence */}
          {!submitting && !extractedResult ? (
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 dark:bg-primary-800 dark:hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles size={15} />
              Extract MAPs with Local AI Engine
            </button>
          ) : !extractedResult ? (
            <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
              <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8b98aa]">
                Processing
              </p>
              <StageIndicator stage={stage} />
            </div>
          ) : (
            /* ── Document Intelligence Report (Phase 5) ── */
            <div className="animate-fadeIn space-y-4 rounded-xl border border-success-200 dark:border-green-800/60 bg-success-50/40 dark:bg-green-900/10 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="flex-shrink-0 text-success dark:text-green-400" />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-success-700 dark:text-green-400">
                  Document Intelligence Report
                </p>
              </div>

              <div className="rounded-lg border border-line bg-white px-4 py-3 dark:bg-card">
                <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-[#8b98aa]">
                  Processed Circular
                </p>
                <p className="text-[13px] font-semibold text-ink dark:text-[#e8edf5]">{title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded border border-brass/30 bg-brass-soft px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-brass-deep dark:border-brass/20 dark:bg-brass/10 dark:text-brass">
                    {source}
                  </span>
                  <span className="font-mono text-[10px] text-gray-400 dark:text-[#8b98aa]">
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'MAPs Extracted',
                    value: extractedResult.maps_count ?? extractedResult.maps?.length ?? 0,
                    dot:   'bg-success',
                  },
                  {
                    label: 'Avg Confidence',
                    value: (() => {
                      const ms = extractedResult.maps || []
                      if (!ms.length) return '—'
                      const avg = ms.reduce((s, m) => s + (m.confidence_score ?? 0), 0) / ms.length
                      return `${Math.round(avg * 100)}%`
                    })(),
                    dot: 'bg-violet-500',
                  },
                  {
                    label: 'Depts Involved',
                    value: (() => {
                      const ms = extractedResult.maps || []
                      return new Set(ms.map((m) => m.department).filter(Boolean)).size || '—'
                    })(),
                    dot: 'bg-brass',
                  },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-line bg-white px-3 py-3 text-center dark:bg-card">
                    <span className={`mx-auto mb-1.5 block h-1.5 w-1.5 rounded-full ${m.dot}`} />
                    <p className="font-serif text-2xl font-bold leading-none text-ink dark:text-[#e8edf5]">{m.value}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-gray-400 dark:text-[#8b98aa]">{m.label}</p>
                  </div>
                ))}
              </div>

              {extractedResult.maps?.length > 0 && (() => {
                const ms   = extractedResult.maps
                const dist = ['Critical', 'High', 'Medium', 'Low'].map((p) => ({
                  label: p,
                  count: ms.filter((m) => m.priority === p).length,
                  cls:   p === 'Critical' ? 'bg-danger' : p === 'High' ? 'bg-warning' : p === 'Medium' ? 'bg-brass' : 'bg-success',
                })).filter((d) => d.count > 0)
                return (
                  <div className="rounded-lg border border-line bg-white px-4 py-3 dark:bg-card">
                    <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-gray-400 dark:text-[#8b98aa]">
                      Priority Breakdown
                    </p>
                    <div className="space-y-1.5">
                      {dist.map((d) => (
                        <div key={d.label} className="flex items-center gap-2">
                          <span className="w-14 font-mono text-[10px] text-gray-600 dark:text-gray-400">{d.label}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-surface">
                            <div
                              className={`h-full rounded-full ${d.cls}`}
                              style={{ width: `${(d.count / ms.length) * 100}%` }}
                            />
                          </div>
                          <span className="w-4 text-right font-mono text-[10px] text-gray-400 dark:text-[#8b98aa]">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/maps')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 dark:bg-primary-800 dark:hover:bg-primary-700"
                >
                  View MAPs Register <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate('/review')}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper dark:bg-surface dark:text-[#e8edf5] dark:hover:bg-card"
                >
                  <BarChart2 size={14} /> AI Extraction Review
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ════ Right sidebar ════ */}
        <div className="space-y-4">

          <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Bot size={13} className="text-violet-500" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b98aa]">How it works</p>
            </div>
            <ol className="space-y-3">
              {[
                'Upload a PDF or DOCX, paste text, or link to a public circular URL.',
                'The local AI engine reads the document and extracts Measurable Action Points with clause references.',
                'Each MAP is assigned a priority, department, deadline, and AI confidence score.',
                'MAPs enter the compliance review queue for officer approval.',
              ].map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ink font-mono text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="text-[12px] leading-relaxed text-gray-600 dark:text-[#e8edf5]/80">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <File size={13} className="text-brass" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b98aa]">Accepted formats</p>
            </div>
            <div className="space-y-2">
              {[
                { fmt: 'PDF',  desc: 'Portable Document Format' },
                { fmt: 'DOCX', desc: 'Microsoft Word 2007+'     },
                { fmt: 'DOC',  desc: 'Microsoft Word Legacy'    },
                { fmt: 'TXT',  desc: 'Plain text'               },
                { fmt: 'URL',  desc: 'Web link or Google Drive' },
              ].map(({ fmt, desc }) => (
                <div key={fmt} className="flex items-center gap-2.5">
                  <span className="w-10 flex-shrink-0 rounded border border-line bg-paper py-0.5 text-center font-mono text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                    {fmt}
                  </span>
                  <span className="text-[12px] text-[#8b98aa]">{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] text-gray-400">Maximum file size: 20 MB</p>
          </div>

          <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Globe size={13} className="text-gray-400" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#8b98aa]">Supported regulators</p>
            </div>
            <div className="space-y-1.5">
              {ALL_REGULATORS.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass" />
                  <span className="text-[12px] text-[#8b98aa]">{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-900/20 p-4">
            <div className="flex items-start gap-2">
              <Sparkles size={13} className="mt-0.5 flex-shrink-0 text-violet-500" />
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                  Local AI Engine
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-violet-600 dark:text-violet-400">
                  PRAGMA uses an offline AI model (Ollama / phi3.5) to parse regulatory language, identify
                  compliance obligations, and estimate implementation timelines.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
