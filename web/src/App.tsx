import { ThemeToggle } from './components/theme-toggle'
import { Activity } from 'lucide-react'
import { StatusHeader } from '@/components/status-header'
import { IncidentList } from '@/components/incident-list'
import { ConnectionStatus } from '@/components/connection-status'
import { useStatus } from '@/hooks/use-status'

function App() {
	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
					<div className="flex items-center gap-2">
						<Activity className="h-5 w-5" aria-hidden />
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
				<AppBody />
			</main>
		</div>
	)
}

export default App

function AppBody() {
	const { status, loading, connectionStatus, lastUpdated, refetch } = useStatus()
	return (
		<>
			<ConnectionStatus status={connectionStatus} lastUpdated={lastUpdated} onRefresh={refetch} />
			<StatusHeader incidents={status?.incidents || []} lastUpdated={status?.lastUpdated || new Date().toISOString()} />
			{!loading && <IncidentList incidents={status?.incidents || []} showResolved />}
		</>
	)
}
