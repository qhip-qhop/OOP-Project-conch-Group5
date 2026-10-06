import { useEffect, useRef, useState } from 'react'
import { Routes, Route } from 'react-router'

import Navbar from './components/Navbar'
import QuizPage from './pages/QuizPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

import lightModeSound from './assets/sfx/lightmodereal.wav'
import darkModeSound from './assets/sfx/darkmodereal.wav'

type Theme = 'light' | 'dark'

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('theme')

  return stored === 'dark' || stored === 'light'
    ? stored
    : 'light'
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const soundsRef = useRef<Record<Theme, HTMLAudioElement> | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      theme === 'dark'
    )

    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    soundsRef.current = {
      light: new Audio(lightModeSound),
      dark: new Audio(darkModeSound),
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'

    setTheme(next)

    const audio = soundsRef.current?.[next]

    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text flex items-start justify-center pt-4.5 pb-8 font-mono">
      <div className="flex flex-col gap-4 w-[70vw] max-w-300 min-h-[70vh]">

        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <Routes>
          <Route path="/" element={<QuizPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>

      </div>
    </div>
  )
}