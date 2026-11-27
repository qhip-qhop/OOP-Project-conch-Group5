import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'

import FilterGroup from '../components/FilterGroup'
import HeroInput from '../components/HeroInput'
import QuestionCard from '../components/QuestionCard'
import LoadingCard from '../components/LoadingCard'
import ScoreCard from '../components/ScoreCard'

import {
  generateQuiz,
  type QuizQuestion,
} from '../services/gemini'
import { getScore } from '../components/Scoring'

type FetchPhase = 'idle' | 'fetching' | 'done'

export interface QuizSession {
  id: string
  date: string
  topic: string
  mode: string
  difficulty: string
  totalQuestions: number
  score: number
  questions: QuizQuestion[]
  answers: Record<number, string>
}

const getSavedSettings = () => {
  try {
    const raw = localStorage.getItem('conch_settings')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export default function QuizPage() {
  const savedSettings = getSavedSettings()

  const [difficulty, setDifficulty] = useState(
    () => savedSettings.defaultDifficulty || 'easy'
  )
  const [mode, setMode] = useState(
    () => savedSettings.defaultMode || 'all'
  )
  const [questioncount, setQuestioncount] = useState(
    () => savedSettings.defaultCount || '5'
  )

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    const saved = localStorage.getItem('quiz_questions')
    if (!saved) return []
    try {
      return JSON.parse(saved)
    } catch {
      return []
    }
  })

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('quiz_answers')
    if (!saved) return {}
    try {
      return JSON.parse(saved)
    } catch {
      return {}
    }
  })

  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('quiz_current_index')
    return saved ? Number(saved) : 0
  })

  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState(() => {
    return localStorage.getItem('quiz_topic') || ''
  })
  const [files, setFiles] = useState<File[]>([])
  const [fetchPhase, setFetchPhase] = useState<FetchPhase>('idle')

  const [showQuestions, setShowQuestions] = useState(() => {
    const saved = localStorage.getItem('quiz_questions')
    if (!saved) return false
    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) && parsed.length > 0
    } catch {
      return false
    }
  })

  const [isAnswering, setIsAnswering] = useState(() => {
    const saved = localStorage.getItem('is_answering')
    return saved ? JSON.parse(saved) : false
  })

  const [isFinished, setIsFinished] = useState<boolean>(() =>
    readStored<boolean>('quiz_finished', false)
  )
  const [timings, setTimings] = useState<Record<number, number>>(() =>
    readStored<Record<number, number>>('quiz_timings', {})
  )

  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('quiz_session_id')
  })

  const transitionTimers = useRef<number[]>([])
  const questionStartedAt = useRef(Date.now())
  const location = useLocation()

  useEffect(() => {
    localStorage.setItem('quiz_questions', JSON.stringify(questions))
  }, [questions])

  useEffect(() => {
    localStorage.setItem('quiz_current_index', currentIndex.toString())
  }, [currentIndex])

  useEffect(() => {
    localStorage.setItem('quiz_answers', JSON.stringify(answers))
  }, [answers])

  useEffect(() => {
    localStorage.setItem('quiz_topic', topic)
  }, [topic])

  useEffect(() => {
    localStorage.setItem('is_answering', JSON.stringify(isAnswering))
  }, [isAnswering])

  useEffect(() => {
    localStorage.setItem('quiz_finished', JSON.stringify(isFinished))
  }, [isFinished])

  useEffect(() => {
    localStorage.setItem('quiz_timings', JSON.stringify(timings))
  }, [timings])

  useEffect(() => {
    if (location.state?.session) {
      const { session } = location.state as { session: QuizSession }

      setQuestions(session.questions)
      setAnswers(session.answers || {})
      setCurrentIndex(0)
      setSessionId(session.id)
      setShowQuestions(true)
      setIsFinished(false)
      setTimings({})
      questionStartedAt.current = Date.now()
      localStorage.setItem('quiz_session_id', session.id)
    }
  }, [location.state])

  useEffect(() => {
    if (!sessionId) return
    const raw = localStorage.getItem('quiz_history')
    if (!raw) return

    const history: QuizSession[] = JSON.parse(raw)
    const updated = history.map((item) =>
      item.id === sessionId ? { ...item, answers } : item
    )
    localStorage.setItem('quiz_history', JSON.stringify(updated))
  }, [answers, sessionId])

  const clearTransitionTimers = () => {
    transitionTimers.current.forEach((timer) => window.clearTimeout(timer))
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

  const goToQuestion = (index: number) => {
    const now = Date.now()

    setTimings((prev) => ({
      ...prev,
      [currentIndex]:
        (prev[currentIndex] ?? 0) + (now - questionStartedAt.current),
    }))
    questionStartedAt.current = now
    setCurrentIndex(index)
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1)
    }
  }

  const handleFinish = () => {
    const now = Date.now()
    const finalTimings = {
      ...timings,
      [currentIndex]:
        (timings[currentIndex] ?? 0) + (now - questionStartedAt.current),
    }

    setTimings(finalTimings)
    setIsFinished(true)

    const { correct } = getScore(questions, answers)

    try {
      const raw = localStorage.getItem('quiz_history')
      const history: QuizSession[] = raw ? JSON.parse(raw) : []

      localStorage.setItem(
        'quiz_history',
        JSON.stringify(
          history.map((item) =>
            item.id === sessionId
              ? { ...item, score: correct, answers }
              : item
          )
        )
      )
    } catch (e) {
      console.error('Failed to save score to history:', e)
    }
  }

  const handleRetake = () => {
    setAnswers({})
    setTimings({})
    setCurrentIndex(0)
    setIsFinished(false)
    questionStartedAt.current = Date.now()
  }

    const handleGenerate = async () => {
    const count = Number(questioncount)

    if (!Number.isInteger(count) || count < 1 || count > 50) {
      window.alert('Enter a question count between 1 and 50.')
      return
    }

    clearTransitionTimers()

    setIsAnswering(true)
    setIsFinished(false)
    setTimings({})
    setLoading(true)
    setShowQuestions(false)
    setFetchPhase('fetching')

    const start = performance.now()

    try {
      const data = await generateQuiz(
        topic,
        count,
        difficulty,
        mode,
        files
      )

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions were generated.')
      }

      // Store generated topic and questions
      setTopic(data.topic)
      setQuestions(data.questions)
      setAnswers({})
      setCurrentIndex(0)

      const newSession: QuizSession = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }),
        topic: data.topic || topic || 'General Quiz',
        mode,
        difficulty,
        totalQuestions: data.questions.length,
        score: 0,
        questions: data.questions,
        answers: {},
      }

      setSessionId(newSession.id)
      localStorage.setItem('quiz_session_id', newSession.id)

      try {
        const raw = localStorage.getItem('quiz_history')
        const history: QuizSession[] = raw ? JSON.parse(raw) : []
        localStorage.setItem('quiz_history', JSON.stringify([newSession, ...history]))
      } catch (e) {
        console.error('Failed to save to history:', e)
      }

      // ???? wat this do
      const remaining = Math.max(0, 5000 - (performance.now() - start))

      const doneTimer = window.setTimeout(() => {
        setFetchPhase('done')

        const exitTimer = window.setTimeout(() => {
          questionStartedAt.current = Date.now()
          setShowQuestions(true)
          setLoading(false)
          setFetchPhase('idle')
        }, 1000)

        transitionTimers.current.push(exitTimer)
      }, remaining)

      transitionTimers.current.push(doneTimer)

    } catch (err) {
      console.error('Quiz generation failed:', err)
      setIsAnswering(false)
      setFetchPhase('idle')
      setLoading(false)
      setShowQuestions(false)
    }
  }

  const resetQuiz = () => {
    setIsAnswering(false)
    setShowQuestions(false)
    setIsFinished(false)
    setQuestions([])
    setAnswers({})
    setTimings({})
    setCurrentIndex(0)
    setTopic('')
  }

  const handleCloseQuiz = () => {
    const shouldConfirm = (getSavedSettings().confirmExit ?? 'on') === 'on'

    if (shouldConfirm && !window.confirm('Close current quiz session?')) {
      return
    }

    resetQuiz()
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div className="w-full">

      <div className="flex justify-center gap-8 flex-wrap">
        <FilterGroup
          label="difficulty"
          options={['easy', 'normal', 'hard']}
          icons={['child_care', 'school', 'history_edu']}
          selected={difficulty}
          onSelect={setDifficulty}
        />

        <FilterGroup
          label="mode"
          options={['all', 'mc', 'true/false', 'checkbox', 'fill-in']}
          icons={['apps', 'list_alt', 'flaky', 'check_box', 'keyboard']}
          selected={mode}
          onSelect={setMode}
        />

        <FilterGroup
          label="questions"
          options={['5', '10', '20', 'custom']}
          icons={['', '', '', 'tune']}
          selected={questioncount}
          onSelect={setQuestioncount}
        />
      </div>

      {showQuestions && currentQuestion && isAnswering && !isFinished && (
        <div className="flex flex-row justify-end">
          <button
            className="material-symbols-outlined text-3xl! cursor-pointer"
            onClick={handleCloseQuiz}
          >
            close
          </button>
        </div>
      )}

      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        {fetchPhase !== 'idle' && !showQuestions && (
          <LoadingCard status={fetchPhase} />
        )}

        {showQuestions && currentQuestion && isAnswering && !isFinished && (
          <div className="w-full flex flex-col items-center justify-center gap-4">
            <div className="lowercase text-light-text/60 dark:text-dark-text/60">
              {topic}
            </div>

            <QuestionCard
              id={currentQuestion.id}
              type={currentQuestion.type}
              question={currentQuestion.question}
              choices={currentQuestion.choices}
              selectedChoice={answers[currentIndex]}
              onSelectChoice={handleSelectChoice}
              onNext={handleNext}
              onPrev={handlePrev}
              onFinish={handleFinish}
              isFirstQuestion={currentIndex === 0}
              isLastQuestion={isLastQuestion}
            />
          </div>
        )}

        {showQuestions && currentQuestion && isAnswering && isFinished && (
          <ScoreCard
            topic={topic}
            questions={questions}
            answers={answers}
            timings={timings}
            revealAnswers={getSavedSettings().revealAnswers === 'on'}
            onRetake={handleRetake}
            onNewQuiz={resetQuiz}
          />
        )}

        {!loading && fetchPhase === 'idle' && !isAnswering && (
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
  )
}