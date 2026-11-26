import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { QuestionType } from '../services/gemini'

import typeSound from '../assets/sfx/type.wav'
import typeBackSound from '../assets/sfx/typeback.wav'

interface QuestionCardProps {
  id: number
  type: QuestionType
  question: string
  choices: string[]
  selectedChoice?: string
  onSelectChoice: (choice: string) => void
  onNext: () => void
  onFinish: () => void
  onPrev: () => void
  isFirstQuestion: boolean
  isLastQuestion: boolean
}

const typeNames: Record<QuestionType, string> = {
  mc: 'Multiple Choice',
  'true/false': 'True or False',
  checkbox: 'Checkbox',
  'fill-in': 'Fill-in',
}

export default function QuestionCard({
  id,
  type,
  question,
  choices,
  selectedChoice = '',
  onSelectChoice,
  onNext,
  onFinish,
  onPrev,
  isFirstQuestion,
  isLastQuestion,
}: QuestionCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [deletedChars, setDeletedChars] = useState<
    { char: string; index: number; id: number }[]
  >([])

  const typeAudio = useRef<HTMLAudioElement | null>(null)
  const backAudio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    typeAudio.current = new Audio(typeSound)
    backAudio.current = new Audio(typeBackSound)
  }, [])

  const playSound = (audio: HTMLAudioElement | null) => {
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {})
  }

  const handleFillChange = (value: string) => {
    if (value.length < selectedChoice.length) {
      playSound(backAudio.current)

      const deleted = Array.from(
        { length: selectedChoice.length - value.length },
        (_, i) => ({
          char: selectedChoice[value.length + i],
          index: value.length + i,
          id: Date.now() + Math.random(),
        })
      )

      setDeletedChars((prev) => [...prev, ...deleted])

      setTimeout(() => {
        setDeletedChars((prev) =>
          prev.filter(
            (item) =>
              !deleted.some(
                (char) => char.id === item.id
              )
          )
        )
      }, 400)
    } else if (value.length > selectedChoice.length) {
      playSound(typeAudio.current)
    }

    onSelectChoice(value)
  }

  const selected = selectedChoice.split('|')

  const toggleChoice = (choice: string) => {
    onSelectChoice(
      selected.includes(choice)
        ? selected.filter((item) => item !== choice).join('|')
        : [...selected, choice].join('|')
    )
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="flex flex-col gap-4 p-6 rounded-2xl transition-colors">
        <div className="text-sm text-light-text/70 dark:text-dark-text/70">
          Question {id} - {typeNames[type]}
        </div>

        <div className="font-bold text-xl text-light-text dark:text-dark-text selection:bg-light-text selection:text-light-bg dark:selection:bg-dark-text dark:selection:text-dark-bg">
          {question}
        </div>

        {type === 'fill-in' ? (
          <div className="relative overflow-hidden">
            <input
              type="text"
              value={selectedChoice}
              onChange={(e) => handleFillChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                isFocused || selectedChoice
                  ? ''
                  : 'Type your answer...'
              }
              spellCheck="false"
              className="relative z-10 w-full p-4 rounded-2xl bg-light-bg dark:bg-dark-bg outline-none text-light-text dark:text-dark-text font-mono selection:bg-light-text selection:text-light-bg dark:selection:bg-dark-text dark:selection:text-dark-bg"
            />

            <div className="absolute inset-0 pointer-events-none z-20">
              {deletedChars.map((item) => (
                <div
                  key={item.id}
                  className="absolute top-1/2 left-0 text-base leading-[1.4] px-4 py-4 whitespace-nowrap text-light-text dark:text-dark-text font-mono"
                  style={
                    {
                      '--char-index': item.index,
                      '--random-x-offset': (Math.random() - 0.5) * 8,
                      animation:
                        'charDrop 0.4s linear forwards, charFade 0.1s ease-in forwards 0.05s',
                      marginLeft: 'calc(var(--char-index) * 0.6em)',
                    } as CSSProperties
                  }
                >
                  {item.char}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {choices.map((choice) => {
              const isSelected = selected.includes(choice)

              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() =>
                    type === 'checkbox'
                      ? toggleChoice(choice)
                      : onSelectChoice(choice)
                  }
                  className={`flex cursor-pointer items-center gap-3 p-4 w-full rounded-2xl transition-all duration-200 ease-in-out
                      dark:hover:bg-light-bar/10 hover:bg-dark-bar/10 text-left text-light-text dark:text-dark-text ${
                    isSelected ? 'dark:bg-light-bar/10 bg-dark-bar/10' : 'hover:opacity-90'
                  }`}
                >
                  <div
                    className={`w-5 h-5 shrink-0 border-2 border-light-text dark:border-dark-text transition-all duration-200 ${
                      type === 'checkbox' ? 'rounded-md': 'rounded-full'} ${
                      isSelected ? 'bg-light-text dark:bg-dark-text' : '' }`}
                  />

                  <span>{choice}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            disabled={isFirstQuestion}
            onClick={onPrev}
            className={`px-4 py-2 rounded-xl bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text ${
              isFirstQuestion
                ? 'opacity-30 cursor-not-allowed'
                : 'cursor-pointer hover:opacity-80'
            }`}
          >
            Previous
          </button>

          <button
            type="button"
            onClick={isLastQuestion ? onFinish : onNext}
            className="px-4 py-2 rounded-xl bg-light-text dark:bg-dark-text text-light-bg dark:text-dark-bg font-bold cursor-pointer hover:opacity-90"
          >
            {isLastQuestion ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
