import { useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, CSSProperties } from 'react'

import typeSound from '../assets/sfx/type.wav'
import typeBackSound from '../assets/sfx/typeback.wav'

interface HeroInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  disabled?: boolean
  files: File[]
  onFilesChange: (files: File[]) => void
}

export default function HeroInput({
  value,
  onChange,
  onSubmit,
  disabled,
  files,
  onFilesChange,
}: HeroInputProps) {
  const [deletedChars, setDeletedChars] = useState<
    { char: string; index: number; id: number }[]
  >([])
  const [isFocused, setIsFocused] = useState(false)

  const typeAudio = useRef<HTMLAudioElement | null>(null)
  const backAudio = useRef<HTMLAudioElement | null>(null)

  useLayoutEffect(() => {
    const type = new Audio(typeSound)
    const back = new Audio(typeBackSound)

    type.preload = 'auto'
    back.preload = 'auto'

    typeAudio.current = type
    backAudio.current = back

    return () => {
      type.pause()
      back.pause()
    }
  }, [])

  const playSound = (audio: HTMLAudioElement | null) => {
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {})
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    if (!selected.length) return

    const newFiles = selected.filter(
      (file) =>
        !files.some(
          (old) =>
            old.name === file.name &&
            old.size === file.size
        )
    )

    onFilesChange([...files, ...newFiles])
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value

    if (newValue.length < value.length) {
      playSound(backAudio.current)

      const deleted = Array.from(
        { length: value.length - newValue.length },
        (_, i) => ({
          char: value[newValue.length + i],
          index: newValue.length + i,
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
    } else if (newValue.length > value.length) {
      playSound(typeAudio.current)
    }

    onChange(newValue)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!disabled && onSubmit) onSubmit()
  }

  return (
    <section className="w-full max-w-175 flex flex-col items-center justify-center gap-5">
      <h1 className="m-0 text-[clamp(2rem,2vw+1.2rem,3rem)] leading-tight text-light-text dark:text-dark-text text-center font-mono">
        What's today's topic?
      </h1>

      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full flex items-center gap-3 border border-light-text/35 dark:border-dark-text/35 rounded-full bg-light-bar dark:bg-dark-bar p-[0.6rem_0.9rem_0.6rem_0.5rem] transition-colors">
          <input
            type="file"
            id="file-attachment"
            accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            hidden
            onChange={handleFileChange}
          />

          <label
            htmlFor="file-attachment"
            className="shrink-0 w-10 h-10 rounded-full bg-transparent text-light-text dark:text-dark-text text-2xl grid place-items-center cursor-pointer select-none transition-opacity hover:opacity-70"
            title="Attach TXT, PDF, or DOCX"
          >
            ＋
          </label>

          <div className="flex-1 relative overflow-hidden">
            <input
              type="text"
              value={value}
              onChange={handleChange}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused || value ? '' : 'Type a topic...'}
              spellCheck="false"
              className="w-full border-none bg-transparent text-light-text dark:text-dark-text text-lg leading-[1.4] px-1 py-2 outline-none font-mono transition-colors selection:bg-light-text selection:text-light-bg dark:selection:bg-dark-text dark:selection:text-dark-bg"
            />

            <div className="absolute inset-0 pointer-events-none z-0">
              {deletedChars.map((item) => (
                <div
                  key={item.id}
                  className="absolute top-1/2 left-0 text-lg leading-[1.4] px-1 py-2 whitespace-nowrap text-light-text dark:text-dark-text font-mono"
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
        </div>
      </form>
            {files.length > 0 && (
        <div className="w-full flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-light-bar dark:bg-dark-bar text-light-text dark:text-dark-text text-sm"
            >
              <span className="truncate max-w-55">
                {file.name}
              </span>

              <button
                type="button"
                onClick={() => removeFile(index)}
                className="cursor-pointer opacity-60 hover:opacity-100"
                title="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

