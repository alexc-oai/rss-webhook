import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'

function setDocumentTheme(theme: 'light' | 'dark') {
	const root = document.documentElement
	if (theme === 'dark') root.classList.add('dark')
	else root.classList.remove('dark')
	localStorage.setItem('theme', theme)
}

export function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>(() => {
		if (typeof window === 'undefined') return 'light'
		const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
		if (stored) return stored
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
		return prefersDark ? 'dark' : 'light'
	})

	useEffect(() => {
		setDocumentTheme(theme)
	}, [theme])

	return (
		<Button
			variant="outline"
			size="icon"
			aria-label="Toggle theme"
			onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
		>
			{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
		</Button>
	)
}



