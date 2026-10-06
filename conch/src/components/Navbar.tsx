import { useLocation, useNavigate } from 'react-router'

interface NavbarProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const nav_items = [
  {
    path: '/settings',
    icon: 'settings',
  },
  {
    path: '/history',
    icon: 'history',
  },
  {
    path: '/',
    icon: 'terminal',
  },
]

export default function Navbar({
  theme,
  onToggleTheme,
}: NavbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between pb-4 pt-2">

      <div className="flex flex-row gap-8 text-5xl font-mono font-bold tracking-tighter text-light-text dark:text-dark-text">

        conch

        <div className="flex flex-row items-center justify-center gap-8">
          {nav_items.map((item) => {
            const isActive = pathname === item.path

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`material-symbols-outlined h-fit cursor-pointer transition-colors ${
                  isActive
                    ? 'text-light-text dark:text-dark-text'
                    : 'text-light-text/40 dark:text-dark-text/40'
                }`}
              >
                {item.icon}
              </button>
            )
          })}
        </div>

      </div>

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggleTheme}
        className="w-12 h-12 rounded-full grid place-items-center hover:scale-110 transition-transform duration-200 text-light-text dark:text-dark-text"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined text-2xl">
          {theme === 'light' ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

    </header>
  )
}