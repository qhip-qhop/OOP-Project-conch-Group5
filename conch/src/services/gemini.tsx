import { GoogleGenAI } from '@google/genai'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
})

export interface QuizQuestion {
  id: number
  question: string
  choices: string[]
  answer: string
}

async function readFile(file: File): Promise<string> {
  console.log(`Reading file: ${file.name}`)

  if (file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer()

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
    }).promise

    let text = ''

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()

      const pageText = content.items
        .map((item) => {
          if ('str' in item) {
            return item.str
          }

          return ''
        })
        .join(' ')

      text += pageText + '\n'
    }

    if (!text.trim()) {
      throw new Error(
        `Could not extract text from "${file.name}". The PDF may be scanned or image-only.`
      )
    }

    console.log(
      `Extracted ${text.length} characters from ${file.name}`
    )

    return text
  }

  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx')
  ) {
    const buffer = await file.arrayBuffer()

    const result = await mammoth.extractRawText({
      arrayBuffer: buffer,
    })

    if (!result.value.trim()) {
      throw new Error(
        `Could not extract text from "${file.name}".`
      )
    }

    console.log(
      `Extracted ${result.value.length} characters from ${file.name}`
    )

    return result.value
  }

  throw new Error(
    `Unsupported file type: ${file.name}`
  )
}

export async function generateQuiz(
  topic: string,
  count: number,
  difficulty: string,
  mode: string,
  files: File[]
): Promise<QuizQuestion[]> {
  console.log('Generating quiz...')
  console.log('Topic:', topic)
  console.log('Files:', files)

  let fileContext = ''

  for (const file of files) {
    const text = await readFile(file)

    fileContext += `
===== FILE: ${file.name} =====

${text}

===== END FILE: ${file.name} =====
`
  }

  const prompt = `
Generate a ${count}-question quiz.

Topic:
${topic || 'Use the uploaded documents as the topic.'}

Difficulty:
${difficulty}

Question mode:
${mode}

${
  files.length > 0
    ? `
IMPORTANT:

The uploaded documents are the primary source for this quiz.

Create the questions from the information contained in the uploaded documents.

Do not make up information.

Do not use outside knowledge if the answer can be found in the uploaded documents.

Here are the uploaded documents:

${fileContext}
`
    : `
There are no uploaded documents.

Use your general knowledge about the requested topic.
`
}

Return exactly ${count} questions.

Return ONLY valid JSON using this exact structure:

[
  {
    "id": 1,
    "question": "Question text",
    "choices": [
      "Choice 1",
      "Choice 2",
      "Choice 3",
      "Choice 4"
    ],
    "answer": "Choice 1"
  }
]

Rules:

- Return exactly ${count} questions.
- IDs must start at 1.
- IDs must increase by 1.
- Every question must have exactly 4 choices.
- The answer must exactly match one of the choices.
- Do not include markdown.
- Do not include explanations.
- Return JSON only.
`

  console.log('Sending request to Gemini...')

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const text = response.text

  if (!text) {
    throw new Error('Gemini returned an empty response.')
  }

  console.log('Gemini response received.')

  try {
    return JSON.parse(text) as QuizQuestion[]
  } catch {
    console.error('Invalid Gemini JSON:', text)

    throw new Error(
      'Gemini returned an invalid quiz response.'
    )
  }
}
