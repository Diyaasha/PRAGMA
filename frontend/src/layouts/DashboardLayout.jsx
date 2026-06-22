import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import Toast from '../components/shared/Toast'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-paper text-ink dark:text-[#e8edf5]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <Outlet />
        </main>
        <footer className="border-t border-line bg-paper/80 dark:bg-paper/90 px-6 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600">
              PRAGMA Regulatory Compliance System · Canara Bank Demo
            </span>
            <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600">
              Suraksha Cyber Hackathon 2026 · Powered by Claude AI + FastAPI + PostgreSQL
            </span>
          </div>
        </footer>
      </div>
      <Toast />
    </div>
  )
}
