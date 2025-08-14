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

const PORT = Number(process.env.PORT || 3030);

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

// v0-style status endpoint for frontend
app.get('/api/status', (_req, res) => {
    const list = Array.from(incidents.values()).sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt)
    );
    const mapped = list.map(i => ({
        id: i.guid,
        title: i.title,
        description: i.content,
        status: i.resolved ? 'resolved' : 'investigating',
        impact: deriveImpact(i),
        components: extractComponents(i),
        createdAt: i.publishedAt,
        updatedAt: i.publishedAt,
        isNew: !i.resolved,
    }));
    res.json({
        incidents: mapped,
        components: [
            { name: 'ChatGPT', status: 'operational' },
            { name: 'API', status: 'operational' },
            { name: 'Playground', status: 'operational' },
            { name: 'Sora', status: 'operational' },
        ],
        lastUpdated: new Date().toISOString(),
    });
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

function extractComponents(incident: Incident): string[] {
    const text = `${incident.title} ${incident.content}`.toLowerCase()
    const components: string[] = []
    if (text.includes('chatgpt')) components.push('ChatGPT')
    if (text.includes('api')) components.push('API')
    if (text.includes('playground')) components.push('Playground')
    if (text.includes('sora')) components.push('Sora')
    return components.length ? components : ['General']
}

function deriveImpact(incident: Incident): 'none' | 'minor' | 'major' | 'critical' {
    const text = `${incident.title} ${incident.content}`.toLowerCase()
    if (text.includes('critical')) return 'critical'
    if (text.includes('major')) return 'major'
    if (text.includes('minor') || text.includes('degraded')) return 'minor'
    return incident.resolved ? 'none' : 'major'
}

function handleIncident(incident: Incident) {
    const existing = incidents.get(incident.guid);
    incidents.set(incident.guid, incident);

    const hasActiveIssue = Array.from(incidents.values()).some(i => !i.resolved);
    broadcastEvent('incident', { incident, hasActiveIssue });

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
}

// Test endpoints to simulate incidents locally
app.post('/test/incident', (req, res) => {
    const { title, content, resolved } = req.body as Partial<Incident> & { resolved?: boolean };
    const incident: Incident = {
        guid: `test-${Date.now()}`,
        title: title || 'OpenAI API degraded performance',
        link: 'https://status.openai.com/',
        content: content || 'We are investigating elevated error rates impacting the API.',
        publishedAt: new Date().toISOString(),
        resolved: Boolean(resolved) || false,
    };
    handleIncident(incident);
    res.json({ ok: true, incident });
});

app.post('/test/resolve', (req, res) => {
    const { guid } = req.body as { guid?: string };
    if (!guid || !incidents.has(guid)) {
        return res.status(400).json({ ok: false, error: 'Unknown guid' });
    }
    const existing = incidents.get(guid)!;
    const resolved: Incident = { ...existing, resolved: true, publishedAt: new Date().toISOString() };
    handleIncident(resolved);
    res.json({ ok: true, incident: resolved });
});

// Start server, then poller
const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
});

startRssPoller({
    intervalMs: Number(process.env.POLL_INTERVAL_MS || 15000),
    onIncident: (incident: Incident) => handleIncident(incident),
});

process.on('SIGINT', () => {
	server.close(() => process.exit(0));
});


