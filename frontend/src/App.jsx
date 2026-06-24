import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/shared/ErrorBoundary'
import DashboardLayout from './layouts/DashboardLayout'
import Spinner from './components/shared/Spinner'

// Eagerly loaded — core pages always needed immediately
import Dashboard      from './pages/Dashboard'
import MAPsView       from './pages/MAPsView'

// Lazily loaded — reduces initial bundle by ~180 KB
const ApprovalPanel     = lazy(() => import('./pages/ApprovalPanel'))
const EventLog          = lazy(() => import('./pages/EventLog'))
const CircularUpload    = lazy(() => import('./pages/CircularUpload'))
const ExtractionReview  = lazy(() => import('./pages/ExtractionReview'))
const SimulateView      = lazy(() => import('./pages/SimulateView'))
const TraceabilityGraph = lazy(() => import('./pages/TraceabilityGraph'))

function PageLoader() {
  return <Spinner label="Loading page…" />
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ErrorBoundary>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/maps"      element={<MAPsView />} />
              <Route path="/review"    element={<Suspense fallback={<PageLoader />}><ExtractionReview /></Suspense>} />
              <Route path="/approvals" element={<Suspense fallback={<PageLoader />}><ApprovalPanel /></Suspense>} />
              <Route path="/events"    element={<Suspense fallback={<PageLoader />}><EventLog /></Suspense>} />
              <Route path="/upload"    element={<Suspense fallback={<PageLoader />}><CircularUpload /></Suspense>} />
              <Route path="/simulate"  element={<Suspense fallback={<PageLoader />}><SimulateView /></Suspense>} />
              <Route path="/trace"     element={<Suspense fallback={<PageLoader />}><TraceabilityGraph /></Suspense>} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </AppProvider>
    </ThemeProvider>
  )
}

export default App
