import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import UploadResumePage from './pages/UploadResumePage'
import ResultsDashboard from './pages/ResultsDashboard'
import Navbar from './components/Navbar'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadResumePage />} />
        <Route path="/results" element={<ResultsDashboard />} />
      </Routes>
    </div>
  )
}

export default App
