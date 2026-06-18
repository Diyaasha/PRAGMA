import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import ErrorBoundary from './components/shared/ErrorBoundary'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import MAPsView from './pages/MAPsView'
import ApprovalPanel from './pages/ApprovalPanel'
import EventLog from './pages/EventLog'
import CircularUpload from './pages/CircularUpload'

function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/maps" element={<MAPsView />} />
            <Route path="/approvals" element={<ApprovalPanel />} />
            <Route path="/events" element={<EventLog />} />
            <Route path="/upload" element={<CircularUpload />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </AppProvider>
  )
}

export default App