/**
 * PRAGMA — useBackendStatus
 * Owner: Ashwin — M4 polish
 * Lightweight reachability check for the TopBar status dot. Pings /maps
 * every POLL_INTERVAL_MS and reports online/offline so the indicator
 * matches the per-page sample-data banners.
 */

import { useEffect, useState } from 'react'
import api from '../services/api'
import { POLL_INTERVAL_MS } from '../utils/constants'

export function useBackendStatus() {
  const [online, setOnline] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    const ping = async () => {
      try {
        await api.get('/maps', { timeout: 4000 })
        if (active) setOnline(true)
      } catch {
        if (active) setOnline(false)
      } finally {
        if (active) setChecked(true)
      }
    }
    ping()
    const id = setInterval(ping, POLL_INTERVAL_MS)
    return () => { active = false; clearInterval(id) }
  }, [])

  return { online, checked }
}
