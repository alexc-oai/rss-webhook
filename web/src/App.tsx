import { useEffect, useMemo, useState } from 'react'
import { ThemeToggle } from './components/theme-toggle'
import { Activity, Radio } from 'lucide-react'
import { StatusHeader } from '@/components/status-header'
import { IncidentList } from '@/components/incident-list'
import type { StatusIncident } from '@/types/status'

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
	const [connected, setConnected] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

	useEffect(() => {
		// Initial fetch
		fetch('http://localhost:3000/incidents')
			.then(r => r.json())
            .then((data) => {
                setIncidents(data.incidents || [])
                setIsLoading(false)
            })
			.catch(() => { setIsLoading(false) })

		// SSE connection
		const es = new EventSource('http://localhost:3000/events')
		es.addEventListener('open', () => setConnected(true))
		es.addEventListener('error', () => setConnected(false))
		es.addEventListener('snapshot', (evt) => {
			try {
				const data = JSON.parse((evt as MessageEvent).data)
                setIncidents(data.incidents || [])
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
                // no-op

                // optional: notifications could be handled here if desired
			} catch {}
		})
		return () => es.close()
	}, [])

    const statusIncidents: StatusIncident[] = useMemo(() => {
        const now = Date.now()
        return incidents.map((i) => ({
            id: i.guid,
            title: i.title,
            description: i.content,
            status: i.resolved ? 'resolved' : 'investigating',
            impact: i.resolved ? 'none' : 'major',
            components: [],
            createdAt: i.publishedAt,
            updatedAt: i.publishedAt,
            isNew: !i.resolved && now - new Date(i.publishedAt).getTime() < 1000 * 60 * 60,
        }))
    }, [incidents])

	return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5" aria-hidden />
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Radio className={`h-3.5 w-3.5 ${connected ? 'text-emerald-500' : 'text-amber-500'}`} />
                            {connected ? 'live' : 'reconnecting…'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
                <StatusHeader incidents={statusIncidents} lastUpdated={new Date().toISOString()} />
                {!isLoading && <IncidentList incidents={statusIncidents} showResolved />}
            </main>
        </div>
	)
}

export default App
