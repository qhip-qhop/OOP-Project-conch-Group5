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

  const [answers, setAnswers] =
    useState<Record<number, string>>(() => {
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
  const [topic, setTopic] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fetchPhase, setFetchPhase] =
    useState<FetchPhase>('idle')

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
    localStorage.setItem(
      'quiz_questions',
      JSON.stringify(questions)
    )
  }, [questions])

  useEffect(() => {
    localStorage.setItem(
      'quiz_current_index',
      currentIndex.toString()
    )
  }, [currentIndex])

  useEffect(() => {
    localStorage.setItem(
      'quiz_answers',
      JSON.stringify(answers)
    )
  }, [answers])

  const clearTransitionTimers = () => {
    transitionTimers.current.forEach((timer) =>
      window.clearTimeout(timer)
    )

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

      setQuestions(data)
      setAnswers({})
      setCurrentIndex(0)

      const remaining = Math.max(
        0,
        5000 - (performance.now() - start)
      )

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

  return (
    <div className="w-full">

      <div className="flex justify-center gap-8 flex-wrap">
        <FilterGroup
          label="difficulty"
          options={[
            'easy',
            'normal',
            'hard',
          ]}
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
              type={currentQuestion.type}
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
  )
}