import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'

import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ForecastPage from './pages/Forecast'
import Analytics from './pages/Analytics'
import ModelPerformance from './pages/ModelPerformance'
import DatasetExplorer from './pages/DatasetExplorer'
import ForecastHistory from './pages/ForecastHistory'
import Reports from './pages/Reports'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/landing" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/" replace />
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="main-content"
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Dashboard /></PageWrapper></div></ProtectedRoute>} />
        <Route path="/forecast" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><ForecastPage /></PageWrapper></div></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Analytics /></PageWrapper></div></ProtectedRoute>} />
        <Route path="/model-performance" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><ModelPerformance /></PageWrapper></div></ProtectedRoute>} />
        <Route path="/dataset" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><DatasetExplorer /></PageWrapper></div></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><ForecastHistory /></PageWrapper></div></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Reports /></PageWrapper></div></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AnimatedRoutes />
  )
}
