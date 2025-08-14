import { useEffect, useMemo, useState } from 'react'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card'
import { Separator } from './components/ui/separator'
import { Skeleton } from './components/ui/skeleton'
import { ThemeToggle } from './components/theme-toggle'
import { Activity, Radio, ShieldAlert, CheckCircle2, Clock, Search } from 'lucide-react'

type Incident = {
	guid: string
	title: string
	link: string
	content: string
	publishedAt: string
	resolved: boolean
}

function App() {
	const [incidents, setIncidents] = useState<Incident[]>([])
	const [hasActiveIssue, setHasActiveIssue] = useState<boolean>(false)
	const [connected, setConnected] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
	const [query, setQuery] = useState<string>('')

	useEffect(() => {
		// Initial fetch
		fetch('http://localhost:3000/incidents')
			.then(r => r.json())
			.then((data) => {
				setIncidents(data.incidents || [])
				setHasActiveIssue(Boolean(data.hasActiveIssue))
				setIsLoading(false)
			})
			.catch(() => { setIsLoading(false) })

		// Notifications permission
		if ('Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission()
		}

		// SSE connection
		const es = new EventSource('http://localhost:3000/events')
		es.addEventListener('open', () => setConnected(true))
		es.addEventListener('error', () => setConnected(false))
		es.addEventListener('snapshot', (evt) => {
			try {
				const data = JSON.parse((evt as MessageEvent).data)
				setIncidents(data.incidents || [])
				setHasActiveIssue(Boolean(data.hasActiveIssue))
			} catch {}
		})
		es.addEventListener('incident', (evt) => {
			try {
				const data = JSON.parse((evt as MessageEvent).data)
				const incident: Incident = data.incident
				setIncidents((prev) => {
					const map = new Map(prev.map(i => [i.guid, i]))
					map.set(incident.guid, incident)
					return Array.from(map.values()).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
				})
				setHasActiveIssue(Boolean(data.hasActiveIssue))

				if ('Notification' in window && Notification.permission === 'granted') {
					const isResolved = incident.resolved
					new Notification(isResolved ? 'OpenAI Incident Resolved' : 'OpenAI Status Update', {
						body: incident.title,
					})
				}
			} catch {}
		})
		return () => es.close()
	}, [])

	const status = useMemo(() => {
		return hasActiveIssue ? {
			label: 'Issues ongoing',
			color: 'bg-red-500',
			icon: ShieldAlert,
		} : {
			label: 'All clear',
			color: 'bg-emerald-500',
			icon: CheckCircle2,
		}
	}, [hasActiveIssue])

	const filteredIncidents = useMemo(() => {
		const base = filter === 'all' ? incidents : filter === 'active' ? incidents.filter(i => !i.resolved) : incidents.filter(i => i.resolved)
		if (!query.trim()) return base
		const q = query.toLowerCase()
		return base.filter(i => i.title.toLowerCase().includes(q) || stripHtml(i.content).toLowerCase().includes(q))
	}, [incidents, filter, query])

	const activeCount = incidents.filter(i => !i.resolved).length
	const resolvedCount = incidents.filter(i => i.resolved).length

	function stripHtml(html: string) {
		const div = document.createElement('div')
		div.innerHTML = html
		return div.textContent || div.innerText || ''
	}

	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
					<div className="flex items-center gap-2">
						<Activity className="h-5 w-5" aria-hidden />
						<h1 className="text-base font-semibold tracking-tight">OpenAI Status</h1>
						<Separator className="mx-2 hidden h-5 w-px sm:block" orientation="vertical" />
						<span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
							<span className={`inline-block h-2.5 w-2.5 rounded-full ${status.color}`}></span>
							{status.label}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
							<Radio className={`h-3.5 w-3.5 ${connected ? 'text-emerald-500' : 'text-amber-500'}`} />
							{connected ? 'live' : 'reconnecting…'}
						</span>
						<ThemeToggle />
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-6">
				{/* Hero */}
				<Card className="mb-6 overflow-hidden">
					<CardContent className="relative grid gap-4 p-6 md:grid-cols-3">
						<div className="relative col-span-2 rounded-lg border bg-gradient-to-br from-foreground/5 to-transparent p-5">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<status.icon className="h-6 w-6" />
									<div>
										<div className="text-sm text-muted-foreground">Current status</div>
										<div className="flex items-center gap-2 text-lg font-medium">
											<span className={`inline-flex h-2.5 w-2.5 rounded-full ${status.color}`}></span>
											{status.label}
										</div>
									</div>
								</div>
								<div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Updated {new Date().toLocaleTimeString()}</div>
							</div>
							<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
								<div className="rounded-md border p-3">
									<div className="text-xs text-muted-foreground">Active incidents</div>
									<div className="text-xl font-semibold">{activeCount}</div>
								</div>
								<div className="rounded-md border p-3">
									<div className="text-xs text-muted-foreground">Resolved</div>
									<div className="text-xl font-semibold">{resolvedCount}</div>
								</div>
								<div className="rounded-md border p-3">
									<div className="text-xs text-muted-foreground">Total</div>
									<div className="text-xl font-semibold">{incidents.length}</div>
								</div>
							</div>
						</div>
						<div className="flex flex-col gap-3">
							<div className="relative">
								<Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
								<input
									type="search"
									placeholder="Search incidents…"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>
							<div className="inline-flex rounded-md border p-1">
								<Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All</Button>
								<Button variant={filter === 'active' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('active')}>Active</Button>
								<Button variant={filter === 'resolved' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('resolved')}>Resolved</Button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Timeline / List */}
				{isLoading ? (
					<ul className="space-y-3">
						{Array.from({ length: 3 }).map((_, idx) => (
							<li key={idx}>
								<Card>
									<CardHeader className="flex-row items-center justify-between">
										<Skeleton className="h-4 w-2/3" />
										<Skeleton className="h-5 w-20" />
									</CardHeader>
									<CardContent className="space-y-2">
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-5/6" />
									</CardContent>
									<CardFooter>
										<Skeleton className="h-3 w-28" />
									</CardFooter>
								</Card>
							</li>
						))}
					</ul>
				) : (
					<div className="relative">
						<div className="absolute left-3 top-0 bottom-0 border-l border-border" aria-hidden></div>
						<ul className="space-y-4">
							{filteredIncidents.map((i) => (
								<li key={i.guid} className="relative pl-8">
									<span className={`absolute left-0 top-3 h-2.5 w-2.5 rounded-full ${i.resolved ? 'bg-secondary' : 'bg-destructive'}`}></span>
									<Card>
										<CardHeader className="flex-row items-start justify-between gap-4">
											<CardTitle className="text-base font-medium leading-snug">
												<a href={i.link} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
													{i.title}
												</a>
											</CardTitle>
											<Badge variant={i.resolved ? 'secondary' : 'destructive'}>
												{i.resolved ? 'Resolved' : 'Active'}
											</Badge>
										</CardHeader>
										<CardContent>
											<div className="text-sm text-muted-foreground leading-relaxed">
												{stripHtml(i.content).slice(0, 200)}{stripHtml(i.content).length > 200 ? '…' : ''}
											</div>
										</CardContent>
										<CardFooter>
											<div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
												<Clock className="h-3.5 w-3.5" />{new Date(i.publishedAt).toLocaleString()}
											</div>
										</CardFooter>
									</Card>
								</li>
							))}
							{filteredIncidents.length === 0 && (
								<li>
									<Card>
										<CardContent className="py-10 text-center text-sm text-muted-foreground">No incidents to show.</CardContent>
									</Card>
								</li>
							)}
						</ul>
					</div>
				)}
			</main>
		</div>
	)
}

export default App
