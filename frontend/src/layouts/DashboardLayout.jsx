import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-paper text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-8 py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
