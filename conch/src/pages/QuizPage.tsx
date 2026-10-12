import { useEffect, useRef, useState } from 'react'

import FilterGroup from '../components/FilterGroup'
import HeroInput from '../components/HeroInput'
import QuestionCard from '../components/QuestionCard'
import LoadingCard from '../components/LoadingCard'

import {
  generateQuiz,
  type QuizQuestion,
} from '../services/gemini'

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

export default function QuizPage() {
  const [difficulty, setDifficulty] = useState('easy')
  const [mode, setMode] = useState('all')
  const [questioncount, setQuestioncount] = useState('5')

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

  const transitionTimers = useRef<number[]>([])

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

    const start = performance.now()

    try {
      const data = await generateQuiz(
        topic,
        Number(questioncount),
        difficulty,
        mode,
        files
      )

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
          setShowQuestions(true)
          setLoading(false)
          setFetchPhase('idle')
        }, 1000)

        transitionTimers.current.push(exitTimer)
      }, remaining)

      transitionTimers.current.push(doneTimer)
      
    } catch (err) {
      console.error('Quiz generation failed:', err)
      setFetchPhase('idle')
      setLoading(false)
      setShowQuestions(false)
    }
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div className="w-full">
      {/* navbar only visible when not in active quiz */}
      {!showQuestions && (
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
      )}

      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        {fetchPhase !== 'idle' && !showQuestions && (
          <LoadingCard status={fetchPhase} />
        )}

        {showQuestions && currentQuestion && (
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
              isFirstQuestion={currentIndex === 0}
              isLastQuestion={isLastQuestion}
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
  )
}