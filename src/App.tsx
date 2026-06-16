import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import UploadResumePage from './pages/UploadResumePage'
import ResultsDashboard from './pages/ResultsDashboard'
import GrowthTrackerPage from './pages/GrowthTrackerPage'
import AboutPage from './pages/AboutPage'
import Navbar from './components/Navbar'

function App() {
  const [theme, setTheme] = useState<'light-mode' | 'dark-mode'>('light-mode')

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light-mode' ? 'dark-mode' : 'light-mode')
  }

  return (
    <div className={`min-h-screen ${theme === 'light-mode' ? 'text-slate-800' : 'text-slate-200'}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadResumePage />} />
        <Route path="/results" element={<ResultsDashboard />} />
        <Route path="/tracker" element={<GrowthTrackerPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  )
}

export default App
