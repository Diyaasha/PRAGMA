import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-paper hover:bg-line/60 dark:hover:bg-surface text-[#8b98aa] transition-colors"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={13} /> : <Moon size={13} />}
    </button>
  )
}
