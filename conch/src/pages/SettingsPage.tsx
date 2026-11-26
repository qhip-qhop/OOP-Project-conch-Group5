import { useEffect, useState } from 'react'

const SETTINGS_LIST = [
  {
    title: 'General (working)',
    items: [
		{ 
			key: 'defaultDifficulty',
			label: 'default difficulty',
			options: ['easy', 'normal', 'hard']
		},
		{ 
			key: 'defaultMode',
			label: 'default mode',
			options: ['all', 'mc', 'true/false', 'checkbox', 'fill-in']
		},
		{
			key: 'defaultCount',
			label: 'default question count',
			options: ['5', '10', '20'] 
		},
		{
			key: 'confirmExit',
			label: 'confirm before closing quiz',
			options: ['on', 'off']
		},
		{
			key: 'revealAnswers',
			label: 'reveal questions on summary',
			options: ['off', 'on']
		},
    ],
  },
    {
    title: 'Mechanics (nope)',
    items: [
		{ 
			key: 'questionTimer',
			label: 'question timer',
			options: ['off', '15s', '30s', '60', '90s', '120s']
		},
		{ 
			key: 'suddenDeathMode',
			label: 'death mode',
			options: ['off','on']
		},
		{
			key: 'backTracking',
			label: 'back tracking',
			options: ['on','off'] 
		}
    ],
  },
  {
    title: 'Appearance (nope)',
    items: [
		{ 
			key: 'theme',
			label: 'theme mode',
			options: ['dark', 'light', 'system']
		},
		{ 
			key: 'palette',
			label: 'color palette',
			options: ['slate', 'emerald', 'amber']
		},
		{ 
			key: 'fontScale',
			label: 'font scale',
			options: ['compact', 'default', 'large']
		},
		{ 
			key: 'showTopicHeader',
			label: 'show topic header',
			options: ['on', 'off'] 
		},
    ],
  },
  {
    title: 'Audio & Accessibility (nope)',
    items: [
		{ 
			key: 'sfx',
			label: 'interface sfx',
			options: ['on', 'off']
		},
		{ 
			key: 'volume',
			label: 'volume',
			options: ['100%', '75%', '50%', '25%', '0%']
		},
		{ 
			key: 'motion',
			label: 'reduce motion',
			options: ['off', 'on']
		},
    ],
  },
  {
    title: 'Controls (nope)',
    items: [
		{ key: 'hotkeys',
			label: 'keyboard hotkeys',
			options: ['on', 'off']
		},
		{ key: 'autoNext',
			label: 'auto-advance on select',
			options: ['off', 'on']
		},
		{ key: 'instantReveal',
			label: 'instant answer feedback',
			options: ['off', 'on']
		},
    ],
  }
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('conch_settings')
    return saved ? JSON.parse(saved) : {}
  })

	useEffect(() => {
		localStorage.setItem('conch_settings', JSON.stringify(settings))
	}, [settings])

	const handleCycle = (key: string, options: string[]) => {
		if (key === 'resetSettings') {
			setSettings({})
			localStorage.removeItem('conch_settings')
			return
		}

		const current = settings[key] || options[0]
		const next = options[(options.indexOf(current) + 1) % options.length]
		setSettings((prev) => ({ ...prev, [key]: next }))
	}


	return (
		<div className="w-full items-center flex flex-col font-mono">
		<div className="w-6/7 flex flex-col gap-4">
			<div className="flex flex-row gap-8 items-center title">
			<div className="text-2xl font-bold">Settings</div>
			<div className="text-sm opacity-60">
				manage display preferences, audio cues, and local session data
			</div>
			</div>

			<div
			className="px-8 flex flex-col gap-2 justify-center items-center
			**:transition-all **:duration-150
			[&_.setting-title]:text-xl [&_.setting-title]:w-full [&_.setting-title]:opacity-50 [&_.setting-title]:font-bold
			[&_.setting-pill]:flex [&_.setting-pill]:mb-4 [&_.setting-pill]:flex-col [&_.setting-pill]:w-9/10
			[&_.setting-row]:cursor-pointer [&_.setting-row]:p-2 [&_.setting-row]:px-8 [&_.setting-row]:rounded-2xl [&_.setting-row]:bg-transparent [&_.setting-row]:hover:bg-dark-bar/30 [&_.setting-row]:select-none
			[&_.setting-mode]:flex [&_.setting-mode]:flex-3
			[&_.setting-data]:flex [&_.setting-data]:flex-5 [&_.setting-data]:justify-end [&_.setting-data]:opacity-50
			"
			>
			{SETTINGS_LIST.map((section) => (
				<div key={section.title} className="w-full flex flex-col items-center">
				<div className="setting-title">{section.title}</div>

				<div className="setting-pill">
					{section.items.map((item) => (
					<div
						key={item.key}
						onClick={() => handleCycle(item.key, item.options)}
						className="setting-row flex w-full group"
					>
						<div className="setting-mode">{item.label}</div>
						<div className="setting-data group-hover:opacity-100">
						{settings[item.key] || item.options[0]}
						</div>
					</div>
					))}
				</div>
				</div>
			))}
			</div>
		</div>
		</div>
	)
}