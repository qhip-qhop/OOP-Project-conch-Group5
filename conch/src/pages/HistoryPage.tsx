import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { type QuizSession } from './QuizPage'

const ITEMS_PER_PAGE = 5

export default function HistoryPage() {
  const [history, setHistory] = useState<QuizSession[]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const raw = localStorage.getItem('quiz_history')
    if (raw) {
      try {
        setHistory(JSON.parse(raw))
      } catch (err) {
        console.error('Failed to parse quiz_history:', err)
      }
    }
  }, [])

  const navigate = useNavigate()

  const onSelectQuiz = (session: QuizSession) => {
    localStorage.setItem('is_answering', 'true')
    navigate('/', { state: { session } })
  }

  const filtered = history.filter((item) => {
    const query = search.toLowerCase().trim()
    return (
      item.topic.toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <div className="w-full items-center flex flex-col pb-12 font-mono">
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-row gap-8 items-center title">
          <div className="text-2xl font-bold">History</div>
          <div className="text-sm opacity-60">
            archive of previous quiz runs, performance breakdown, and answer logs
          </div>
        </div>

        <div className="px-8 flex flex-col gap-3 justify-center items-center **:transition-all **:duration-100">
          <div className="flex flex-row justify-between text-xl w-full font-bold">
            <div className="flex items-center opacity-50">
              Past Sessions: {filtered.length} Quizzes
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search topic or date..."
              className="text-sm rounded-2xl border opacity-70 p-2 px-4 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl flex p-4 flex-col w-full">
            <div className="**:w-full flex w-full justify-evenly p-2 text-xs uppercase opacity-40 font-bold">
              <div className="flex-1">date</div>
              <div className="flex-3">topic</div>
              <div className="flex-1">mode</div>
              <div className="flex-1">difficulty</div>
              <div className="flex-1">score</div>
            </div>

            {paginatedItems.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-40">
                No quiz history found.
              </div>
            ) : (
              paginatedItems.map((item) => (
                <div
                  className="**:flex *:w-full opacity-70 hover:opacity-100 transition-all flex w-full p-4 hover:bg-dark-bar/30 duration-200 cursor-pointer rounded-2xl"
                  onClick={() => onSelectQuiz(item)}
                  key={item.id}
                >
                  <div className="flex-1">{item.date}</div>
                  <div className="flex-3 truncate pr-2">{item.topic}</div>
                  <div className="flex-1">{item.mode}</div>
                  <div className="flex-1">{item.difficulty}</div>
                  <div className="flex-1">
                    {item.score}/{item.totalQuestions}
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between w-full px-2 pt-2 text-xs opacity-60">
              <div>
                page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="text-base px-3 py-1 rounded-xl hover:opacity-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`text-base px-2.5 py-1 rounded-xl cursor-pointer ${
                      currentPage === page
                        ? 'bg-dark-bar font-bold opacity-100'
                        : 'hover:bg-dark-bar/40 opacity-60'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="text-base px-3 py-1 rounded-xl hover:opacity-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}