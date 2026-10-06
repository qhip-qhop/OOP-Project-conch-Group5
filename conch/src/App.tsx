import { useState } from 'react'
import { Routes, Route } from 'react-router'
import Navbar from './components/Navbar'
import QuizPage from './pages/QuizPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="min-h-screen bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text flex items-start justify-center pt-4.5 pb-8 font-mono">
      <div className="flex flex-col gap-4 w-[70vw] max-w-300 min-h-[70vh]">
        
        <Navbar theme={theme} onToggleTheme={toggleTheme} />

        <Routes>
          <Route path="/" element={<QuizPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>

      </div>
    </div>
  )
}