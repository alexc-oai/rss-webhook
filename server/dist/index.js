"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_notifier_1 = __importDefault(require("node-notifier"));
const poller_1 = require("./poller");
dotenv_1.default.config();
const PORT = Number(process.env.PORT || 3030);
// In-memory state
const incidents = new Map();
const sseClients = [];
let nextClientId = 1;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
// Health
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
// v0-style status endpoint for frontend
app.get('/api/status', (_req, res) => {
    const list = Array.from(incidents.values()).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const mapped = list.map(i => ({
        id: i.guid,
        title: i.title,
        description: i.content,
        status: i.resolved ? 'resolved' : 'investigating',
        impact: i.resolved ? 'none' : 'major',
        components: [],
        createdAt: i.publishedAt,
        updatedAt: i.publishedAt,
        isNew: !i.resolved,
    }));
    res.json({
        incidents: mapped,
        components: [],
        lastUpdated: new Date().toISOString(),
    });
});
// Current incidents and overall status
app.get('/incidents', (_req, res) => {
    const list = Array.from(incidents.values()).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
    const client = { id: clientId, res };
    sseClients.push(client);
    // Send initial snapshot
    const list = Array.from(incidents.values()).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const hasActiveIssue = list.some(i => !i.resolved);
    res.write(`event: snapshot\n`);
    res.write(`data: ${JSON.stringify({ hasActiveIssue, incidents: list })}\n\n`);
    req.on('close', () => {
        const idx = sseClients.findIndex(c => c.id === clientId);
        if (idx !== -1)
            sseClients.splice(idx, 1);
    });
});
function broadcastEvent(event, data) {
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
(0, poller_1.startRssPoller)({
    intervalMs: Number(process.env.POLL_INTERVAL_MS || 15000),
    onIncident: (incident) => {
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
                node_notifier_1.default.notify({
                    title: incident.resolved ? 'OpenAI Incident Resolved' : 'OpenAI Status Update',
                    message: incident.title,
                    subtitle: incident.resolved ? 'Resolved' : 'Active',
                    open: incident.link,
                });
            }
            catch {
                // best-effort; ignore failures
            }
        }
    },
});
process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});
//# sourceMappingURL=index.js.map