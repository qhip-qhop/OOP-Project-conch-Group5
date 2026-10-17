import { useEffect, useState } from 'react'
import { type QuizSession } from './QuizPage'

export default function HistoryPage() {
	const [history, setHistory] = useState<QuizSession[]>([])
	const [search, setSearch] = useState('')

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

	const filtered = history.filter((item) =>
		item.topic.toLowerCase().includes(search.toLowerCase())
	)

	return (
		<div className="w-full items-center flex flex-col h-150">
			<div className="w-full flex flex-col gap-4">
				<div className="flex flex-row gap-8 items-center title">
					<div className="text-2xl font-bold">History</div>
					<div className="text-s opacity-60">archive of previous quiz runs, performance breakdown, and answer logs</div>
				</div>
				<div className="px-8 flex flex-col gap-2 justify-center items-center **:transition-all **:duration-100">
					<div className="flex flex-row justify-between text-xl w-full font-bold">
						<div className="flex items-center opacity-50">
							Past Sessions: {filtered.length} Quizzes
						</div>
						<input type="text" placeholder="Search topic..." 
							className="text-sm rounded-2xl bg-dark-bar p-2 px-4"
						/>
					</div>
					<div className="border flex p-4 flex-col w-full">
						<div className="**: **:w-full flex w-full justify-evenly p-2 ">
							<div className="flex-2">date</div>
							<div className="flex-3">topic</div>
							<div className="flex-1">mode</div>
							<div className="flex-1">difficulty</div>
							<div className="flex-1">score</div>
							<div className="flex-1">action</div>
						</div>
						{filtered.length === 0 ? (
							<div className="text-center py-8 text-sm opacity-40">
								No quiz history found.
							</div>
						) : (
							filtered.map((item) => (
								<div className="
								**:w-full **:opacity-50 transition-all
								flex w-full justify-evenly p-2 hover:bg-dark-bar/30 duration-200 cursor-pointer rounded-2xl">
									<div className="flex-2">{item.date}</div>
									<div className="flex-3">{item.topic}</div>
									<div className="flex-1">{item.mode}</div>
									<div className="flex-1">{item.difficulty}</div>
									<div className="flex-1">{item.score}/{item.totalQuestions}</div>
									<div className="flex-1">?</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	)
}