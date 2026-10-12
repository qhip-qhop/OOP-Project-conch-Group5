export default function SettingsPage() {
	return (
		<div className="w-full items-center flex flex-col h-150">
			<div className="w-6/7 flex flex-col gap-4">
				<div className="flex flex-row gap-8 items-center title">
					<div className="text-2xl font-bold">Settings</div>
					<div className="text-s opacity-60">manage display preferences, audio cues, and local session data (mock, nothing works btw)</div>
				</div>
				<div className="px-8 flex flex-col gap-2 justify-center items-center
					**:transition-all **:duration-100
					[&_.setting-title]:text-xl [&_.setting-title]:w-full [&_.setting-title]:opacity-50 [&_.setting-title]:font-bold
					[&_.setting-pill]:flex [&_.setting-pill]:mb-4 [&_.setting-pill]:flex-col [&_.setting-pill]:w-9/10
					[&_.setting-row]:cursor-pointer [&_.setting-row]:p-2 [&_.setting-row]:px-8 [&_.setting-row]:rounded-2xl [&_.setting-row]:hover:bg-dark-bar/50
					[&_.setting-mode]:flex [&_.setting-mode]:flex-3
					[&_.setting-data]:flex [&_.setting-data]:flex-5 [&_.setting-data]:justify-end [&_.setting-data]:opacity-50
					">
					<div className="setting-title">Appearance</div>
					<div className="setting-pill">
						<div className="setting-row flex w-full">
							<div className="setting-mode">theme mode</div>
							<div className="setting-data">setting-state-1</div>
						</div>
						<div className="setting-row flex w-full">
							<div className="setting-mode">color palette</div>
							<div className="setting-data">setting-state-2</div>
						</div>
					</div>
					<div className="setting-title">Audio & Accessibility</div>
					<div className="setting-pill">
						<div className="setting-row flex w-full">
							<div className="setting-mode">interface sfx</div>
							<div className="setting-data">setting-state-1</div>
						</div>
						<div className="setting-row flex w-full">
							<div className="setting-mode">volume</div>
							<div className="setting-data">setting-state-2</div>
						</div>
						<div className="setting-row flex w-full">
							<div className="setting-mode">reduce motion</div>
							<div className="setting-data">setting-state-3</div>
						</div>
					</div>
					<div className="setting-title">Controls</div>
					<div className="setting-pill">
						<div className="setting-row flex w-full">
							<div className="setting-mode">keyboard hotkeys</div>
							<div className="setting-data">setting-state-1</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}