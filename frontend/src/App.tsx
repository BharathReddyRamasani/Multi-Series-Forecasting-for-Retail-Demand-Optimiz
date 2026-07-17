import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, lazy } from 'react'

import Sidebar from './components/Sidebar'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ForecastPage = lazy(() => import('./pages/Forecast'))
const Analytics = lazy(() => import('./pages/Analytics'))
const ModelPerformance = lazy(() => import('./pages/ModelPerformance'))
const DatasetExplorer = lazy(() => import('./pages/DatasetExplorer'))
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'))
const ForecastHistory = lazy(() => import('./pages/ForecastHistory'))
const DecisionIntelligence = lazy(() => import('./pages/DecisionIntelligence'))
const Stores = lazy(() => import('./pages/Stores'))
const Items = lazy(() => import('./pages/Items'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Settings = lazy(() => import('./pages/Settings'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoaded } = useAuth()
  if (!isLoaded) return <div className="loading-center"><div className="spinner-lg" /></div>
  return isAuthenticated ? children : <Navigate to="/landing" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoaded } = useAuth()
  if (!isLoaded) return <div className="loading-center"><div className="spinner-lg" /></div>
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
    <Suspense fallback={<div className="loading-center"><div className="spinner-lg" /></div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login/*" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register/*" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Dashboard /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/forecast" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><ForecastPage /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Analytics /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/model-performance" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><ModelPerformance /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/dataset" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><DatasetExplorer /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><ForecastHistory /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/decision-intelligence" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><DecisionIntelligence /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/stores" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Stores /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Items /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Inventory /></PageWrapper></div></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><div className="app-layout"><Sidebar /><PageWrapper><Settings /></PageWrapper></div></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

export default function App() {
  return (
    <AnimatedRoutes />
  )
}
