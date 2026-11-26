import type { QuizQuestion } from '../services/gemini'

const splitChoices = (value: string) =>
  value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)

const normalize = (value: string) => value.trim().toLowerCase()

export const isCorrect = (question: QuizQuestion, given?: string): boolean => {
  if (!given?.trim()) return false

  if (question.type === 'checkbox') {
    const picked = splitChoices(given).map(normalize).sort()
    const expected = splitChoices(question.answer).map(normalize).sort()

    return (
      picked.length === expected.length &&
      picked.every((choice, i) => choice === expected[i])
    )
  }

  return normalize(given) === normalize(question.answer)
}

export const getScore = (
  questions: QuizQuestion[],
  answers: Record<number, string>
) => {
  const correct = questions.filter((q, i) => isCorrect(q, answers[i])).length
  const total = questions.length

  return {
    correct,
    total,
    percent: total > 0 ? Math.round((correct / total) * 100) : 0,
  }
}

export const formatAnswer = (question: QuizQuestion, value?: string) => {
  if (!value?.trim()) return 'No answer'

  return question.type === 'checkbox'
    ? splitChoices(value).join(', ')
    : value
}

export const formatDuration = (ms: number) => {
  const totalSeconds = Math.round(ms / 1000)

  if (totalSeconds < 60) return `${totalSeconds}s`

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}m ${seconds}s`
}