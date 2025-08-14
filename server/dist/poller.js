"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRssPoller = startRssPoller;
const rss_parser_1 = __importDefault(require("rss-parser"));
const FEED_URL = 'https://status.openai.com/feed.rss';
function startRssPoller(options) {
    const parser = new rss_parser_1.default();
    const seenGuids = new Set();
    let isPolling = false;
    async function pollOnce() {
        if (isPolling)
            return;
        isPolling = true;
        try {
            const feed = await parser.parseURL(FEED_URL);
            for (const item of feed.items || []) {
                const guid = String(item.guid || item.link || item.isoDate || item.pubDate || item.title || '');
                if (!guid)
                    continue;
                if (seenGuids.has(guid))
                    continue;
                // Mark as seen first to avoid duplicate notifications if webhook is slow
                seenGuids.add(guid);
                const content = String(item.content || item.contentSnippet || '');
                const resolved = /Status:\s*Resolved/i.test(content);
                const incident = {
                    guid,
                    title: String(item.title || 'OpenAI Status Update'),
                    link: String(item.link || FEED_URL),
                    content,
                    publishedAt: new Date(item.isoDate || item.pubDate || Date.now()).toISOString(),
                    resolved,
                };
                await options.onIncident(incident);
            }
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.error('RSS poll error', err);
        }
        finally {
            isPolling = false;
        }
    }
    // Kick off immediately, then at interval
    pollOnce();
    setInterval(pollOnce, options.intervalMs);
}
//# sourceMappingURL=poller.js.map