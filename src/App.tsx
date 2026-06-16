import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import UploadResumePage from './pages/UploadResumePage'
import ResultsDashboard from './pages/ResultsDashboard'
import GrowthTrackerPage from './pages/GrowthTrackerPage'
import AboutPage from './pages/AboutPage'
import ComparePage from './pages/ComparePage'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen text-slate-800">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadResumePage />} />
        <Route path="/results" element={<ResultsDashboard />} />
        <Route path="/tracker" element={<GrowthTrackerPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </div>
  )
}

export default App
