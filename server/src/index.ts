import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notifier from 'node-notifier';
import { startRssPoller } from './poller';

dotenv.config();

type Incident = {
	guid: string;
	title: string;
	link: string;
	content: string;
	publishedAt: string; // ISO string
	resolved: boolean;
};

const PORT = Number(process.env.PORT || 3000);

// In-memory state
const incidents: Map<string, Incident> = new Map();

// SSE clients
type SseClient = { id: number; res: Response };
const sseClients: SseClient[] = [];
let nextClientId = 1;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

// Current incidents and overall status
app.get('/incidents', (_req, res) => {
	const list = Array.from(incidents.values()).sort((a, b) =>
		b.publishedAt.localeCompare(a.publishedAt)
	);
	const hasActiveIssue = list.some(i => !i.resolved);
	res.json({ hasActiveIssue, incidents: list });
});

// Server-Sent Events endpoint for realtime updates
app.get('/events', (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.flushHeaders();

	const clientId = nextClientId++;
	const client: SseClient = { id: clientId, res };
	sseClients.push(client);

	// Send initial snapshot
	const list = Array.from(incidents.values()).sort((a, b) =>
		b.publishedAt.localeCompare(a.publishedAt)
	);
	const hasActiveIssue = list.some(i => !i.resolved);
	res.write(`event: snapshot\n`);
	res.write(`data: ${JSON.stringify({ hasActiveIssue, incidents: list })}\n\n`);

	req.on('close', () => {
		const idx = sseClients.findIndex(c => c.id === clientId);
		if (idx !== -1) sseClients.splice(idx, 1);
	});
});

function broadcastEvent(event: string, data: unknown) {
	const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
	for (const client of sseClients) {
		client.res.write(payload);
	}
}

// Removed webhook; RSS poller will call into onIncident below.

// Start server, then poller
const server = app.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening on http://localhost:${PORT}`);
});

startRssPoller({
	intervalMs: Number(process.env.POLL_INTERVAL_MS || 15000),
	onIncident: (incident: Incident) => {
		// Upsert incident
		const existing = incidents.get(incident.guid);
		incidents.set(incident.guid, incident);

		const hasActiveIssue = Array.from(incidents.values()).some(i => !i.resolved);

		// Broadcast to clients
		broadcastEvent('incident', { incident, hasActiveIssue });

		// Desktop notification on new or status-changed incident
		const isNew = !existing;
		const changed = existing && existing.resolved !== incident.resolved;
		if (isNew || changed) {
			try {
				notifier.notify({
					title: incident.resolved ? 'OpenAI Incident Resolved' : 'OpenAI Status Update',
					message: incident.title,
					subtitle: incident.resolved ? 'Resolved' : 'Active',
					open: incident.link,
				});
			} catch {
				// best-effort; ignore failures
			}
		}
	},
});

process.on('SIGINT', () => {
	server.close(() => process.exit(0));
});


