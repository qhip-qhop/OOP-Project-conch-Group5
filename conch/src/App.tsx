import { useEffect, useRef, useState } from 'react'

import Navbar from './components/Navbar'
import FilterGroup from './components/FilterGroup'
import HeroInput from './components/HeroInput'
import QuestionCard from './components/QuestionCard'
import LoadingCard from './components/LoadingCard'

import lightModeSound from './assets/sfx/lightmodereal.wav'
import darkModeSound from './assets/sfx/darkmodereal.wav'

import { generateQuiz, type QuizQuestion } from './services/gemini'

type Theme = 'light' | 'dark'

type FetchPhase = 'idle' | 'fetching' | 'done'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = localStorage.getItem('theme')

  return storedTheme === 'dark' || storedTheme === 'light'
    ? storedTheme
    : 'light'
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [difficulty, setDifficulty] = useState('easy')
  const [mode, setMode] = useState('all')
  const [questioncount, setQuestioncount] = useState('5')

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const [topic, setTopic] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const [answers, setAnswers] = useState<Record<number, string>>({})

  const [fetchPhase, setFetchPhase] = useState<FetchPhase>('idle')
  const [showQuestions, setShowQuestions] = useState(false)

  const transitionTimers = useRef<number[]>([])

  const clearTransitionTimers = () => {
    transitionTimers.current.forEach((timer) => {
      window.clearTimeout(timer)
    })

    transitionTimers.current = []
  }

  useEffect(() => {
    return () => clearTransitionTimers()
  }, [])

  const handleSelectChoice = (choice: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: choice,
    }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleGenerate = async () => {
    clearTransitionTimers()

    setLoading(true)
    setShowQuestions(false)
    setFetchPhase('fetching')

    const fetchStart = performance.now()

    try {
      console.log('Generating quiz...')

      const data = await generateQuiz(
        topic,
        Number(questioncount),
        difficulty,
        mode,
        files
      )

      console.log(data)

      setQuestions(data)
      setAnswers({})
      setCurrentIndex(0)

      const elapsed = performance.now() - fetchStart
      const remaining = Math.max(0, 5000 - elapsed)

      const doneTimer = window.setTimeout(() => {
        setFetchPhase('done')

        const exitTimer = window.setTimeout(() => {
          setShowQuestions(true)
          setLoading(false)
          setFetchPhase('idle')
        }, 1000)

        transitionTimers.current.push(exitTimer)
      }, remaining)

      transitionTimers.current.push(doneTimer)
    } catch (err) {
        console.error('Quiz generation failed:', err)

        const message =
          err instanceof Error
            ? err.message
            : String(err)

        alert(message)

        setFetchPhase('idle')
        setLoading(false)
        setShowQuestions(false)
      }
  }

  const currentQuestion = questions[currentIndex]

  const soundsRef = useRef<Record<Theme, HTMLAudioElement> | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    document.documentElement.classList.toggle(
      'dark',
      theme === 'dark'
    )

    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const audioMap: Record<Theme, HTMLAudioElement> = {
      light: new Audio(lightModeSound),
      dark: new Audio(darkModeSound),
    }

    Object.values(audioMap).forEach((audio) => {
      audio.preload = 'auto'
    })

    soundsRef.current = audioMap

    return () => {
      if (soundsRef.current) {
        Object.values(soundsRef.current).forEach((audio) => {
          audio.pause()
        })
      }
    }
  }, [])

  const playThemeSound = (targetTheme: Theme) => {
    const audio = soundsRef.current?.[targetTheme]

    if (!audio) return

    audio.currentTime = 0

    audio.play().catch((error) => {
      console.warn('Audio playback prevented:', error)
    })
  }

  const toggleTheme = () => {
    const nextTheme: Theme =
      theme === 'light' ? 'dark' : 'light'

    setTheme(nextTheme)
    playThemeSound(nextTheme)
  }

  return (
    <div className="min-h-screen bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text flex items-start justify-center pt-4.5 pb-8 font-mono">
      <div className="flex flex-col gap-4 w-[70vw] max-w-300 min-h-[70vh]">
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="flex justify-center gap-8 flex-wrap">
          <FilterGroup
            label="difficulty"
            options={['easy', 'normal', 'hard']}
            icons={[
              'child_care',
              'school',
              'history_edu',
            ]}
            selected={difficulty}
            onSelect={setDifficulty}
          />

          <FilterGroup
            label="mode"
            options={[
              'all',
              'mc',
              'true/false',
              'checkbox',
              'fill-in',
            ]}
            icons={[
              'apps',
              'list_alt',
              'flaky',
              'check_box',
              'keyboard',
            ]}
            selected={mode}
            onSelect={setMode}
          />

          <FilterGroup
            label="questions"
            options={[
              '5',
              '10',
              '20',
              'custom',
            ]}
            icons={[
              '',
              '',
              '',
              'tune',
            ]}
            selected={questioncount}
            onSelect={setQuestioncount}
          />
        </div>

        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          {fetchPhase !== 'idle' && !showQuestions && (
            <LoadingCard status={fetchPhase} />
          )}

          {showQuestions && currentQuestion && (
            <div className="w-full flex justify-center question-reveal">
              <QuestionCard
                id={currentQuestion.id}
                question={currentQuestion.question}
                choices={currentQuestion.choices}
                selectedChoice={answers[currentIndex]}
                onSelectChoice={handleSelectChoice}
                onNext={handleNext}
                onPrev={handlePrev}
                isFirstQuestion={currentIndex === 0}
                isLastQuestion={
                  currentIndex === questions.length - 1
                }
              />
            </div>
          )}

          {!loading &&
            fetchPhase === 'idle' &&
            !showQuestions &&
            !currentQuestion && (
              <HeroInput
                value={topic}
                onChange={setTopic}
                onSubmit={handleGenerate}
                disabled={loading}
                files={files}
                onFilesChange={setFiles}
              />
            )}
        </div>
      </div>
    </div>
  )
}