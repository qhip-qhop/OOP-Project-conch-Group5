import { useEffect, useState } from 'react'

import type { QuizQuestion } from '../services/gemini'
import { formatAnswer, formatDuration, getScore, isCorrect } from './Scoring'

interface ScoreCardProps {
  topic: string
  questions: QuizQuestion[]
  answers: Record<number, string>
  timings: Record<number, number>
  revealAnswers: boolean
  onRetake: () => void
  onNewQuiz: () => void
}

const RING_RADIUS = 50
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

const buttonClass =
  'px-4 py-2 rounded-xl bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text cursor-pointer transition-all duration-200 ease-in-out hover:opacity-80 hover:-translate-y-0.5 active:scale-95'

const toKeys = (value: string) =>
  value
    .split('|')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

function ReviewOptions({
  question,
  given,
  reveal,
}: {
  question: QuizQuestion
  given?: string
  reveal: boolean
}) {
  if (question.type === 'fill-in') {
    const ok = isCorrect(question, given)

    return (
      <div className="pl-7 text-sm">
        <span className={ok ? 'text-correct' : 'text-incorrect'}>
          {formatAnswer(question, given)}
        </span>
        {!ok && reveal && (
          <span className="text-correct">
            {' '}(answer: {formatAnswer(question, question.answer)})
          </span>
        )}
      </div>
    )
  }

  const picked = new Set(
    question.type === 'checkbox'
      ? toKeys(given ?? '')
      : [(given ?? '').trim().toLowerCase()]
  )
  const correct = new Set(
    question.type === 'checkbox'
      ? toKeys(question.answer)
      : [question.answer.trim().toLowerCase()]
  )

  return (
    <div className="pl-7 flex flex-col gap-1 text-sm">
      {question.choices.map((choice) => {
        const key = choice.trim().toLowerCase()
        const isPicked = picked.has(key)
        const isRight = correct.has(key)
        const showRight = isRight && (reveal || isPicked)
        const showWrong = isPicked && !isRight

        return (
          <div
            key={choice}
            className={`flex items-center gap-2 ${
              showRight
                ? 'text-correct font-bold'
                : showWrong
                  ? 'text-incorrect font-bold'
                  : 'text-light-text/50 dark:text-dark-text/50'
            }`}
          >
            <span className="w-3 text-center">
              {showRight ? '✓' : showWrong ? '✕' : ''}
            </span>
            <span>{choice}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function ScoreCard({
  topic,
  questions,
  answers,
  timings,
  revealAnswers,
  onRetake,
  onNewQuiz,
}: ScoreCardProps) {
  const { correct, total, percent } = getScore(questions, answers)
  const [filled, setFilled] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(percent))
    return () => cancelAnimationFrame(frame)
  }, [percent])

  const totalTime = questions.reduce(
    (sum, _, i) => sum + (timings[i] ?? 0),
    0
  )
  const avgTime = total > 0 ? totalTime / total : 0
  const answered = questions.filter((_, i) => answers[i]?.trim()).length
  const ringColor =
    percent >= 70 ? 'stroke-correct' : 'stroke-incorrect'

  return (
      <div className="score-enter w-full max-w-5xl flex flex-col items-center">
        <style>{`
          @keyframes scoreFadeIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .score-enter {
            animation: scoreFadeIn 0.6s ease-in-out both;
          }
        `}</style>

        <div className="w-full flex justify-center pt-12">
          {revealAnswers && (
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                open
                  ? 'flex-1 pr-6 opacity-100'
                  : 'w-0 opacity-0'
              }`}
            >
              <div className="flex flex-col gap-6">
                {questions.map((question, index) => {
                  const given = answers[index]?.trim()

                  return (
                    <div
                      key={index}
                      className={`flex flex-col gap-2 text-light-text dark:text-dark-text transition-all duration-500 ease-in-out ${
                        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                      }`}
                      style={{
                        transitionDelay: `${open ? 150 + index * 70 : 0}ms`,
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="font-bold">
                          <span className="opacity-50 mr-2">{question.id}.</span>
                          {question.question}
                        </div>
                        <span className="shrink-0 text-xs opacity-60">
                          {formatDuration(timings[index] ?? 0)}
                        </span>
                      </div>

                      {given || revealAnswers ? (
                        <ReviewOptions
                          question={question}
                          given={answers[index]}
                          reveal={revealAnswers}
                        />
                      ) : (
                        <div className="pl-7 text-sm opacity-50">No answer</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="shrink-0 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="text-sm text-light-text/70 dark:text-dark-text/70">
                Quiz complete
              </div>
              <div className="lowercase text-light-text/60 dark:text-dark-text/60">
                {topic}
              </div>
            </div>

            <div className="relative w-52 h-52">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="10"
                  className="stroke-light-bar dark:stroke-dark-bar"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="10"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  style={{
                    strokeDashoffset: RING_CIRCUMFERENCE * (1 - filled / 100),
                    transition: `stroke-dashoffset 1.4s ${EASE_OUT}`,
                  }}
                  transform="rotate(-90 60 60)"
                  className={ringColor}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                <span className="text-4xl font-bold text-light-text dark:text-dark-text">
                  {percent}%
                </span>
                <span className="text-xs text-light-text/60 dark:text-dark-text/60">
                  {correct} of {total} correct
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-light-text/70 dark:text-dark-text/70">
              <span>
                total{' '}
                <b className="text-light-text dark:text-dark-text">
                  {formatDuration(totalTime)}
                </b>
              </span>
              <span>
                avg{' '}
                <b className="text-light-text dark:text-dark-text">
                  {formatDuration(avgTime)}
                </b>
              </span>
              <span>
                answered{' '}
                <b className="text-light-text dark:text-dark-text">
                  {answered}/{total}
                </b>
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {revealAnswers && (
                <button
                  type="button"
                  onClick={() => setOpen((value) => !value)}
                  className={buttonClass}
                >
                  {open ? 'Hide' : 'View'}
                </button>
              )}

              <button type="button" onClick={onRetake} className={buttonClass}>
                Retake
              </button>

              <button
                type="button"
                onClick={onNewQuiz}
                className="px-4 py-2 rounded-xl bg-light-text dark:bg-dark-text text-light-bg dark:text-dark-bg font-bold cursor-pointer transition-all duration-200 ease-in-out hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
              >
                New quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    )
}