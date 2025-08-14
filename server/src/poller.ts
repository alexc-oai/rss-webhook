import Parser from 'rss-parser';

type Incident = {
	guid: string;
	title: string;
	link: string;
	content: string;
	publishedAt: string; // ISO string
	resolved: boolean;
};

type StartOptions = {
	intervalMs: number;
	webhookUrl: string;
};

const FEED_URL = 'https://status.openai.com/feed.rss';

export function startRssPoller(options: StartOptions) {
	const parser = new Parser();
	const seenGuids: Set<string> = new Set();
	let isPolling = false;

	async function pollOnce() {
		if (isPolling) return;
		isPolling = true;
		try {
			const feed = await parser.parseURL(FEED_URL);
			for (const item of feed.items || []) {
				const guid = String(item.guid || item.link || item.isoDate || item.pubDate || item.title || '');
				if (!guid) continue;
				if (seenGuids.has(guid)) continue;

				// Mark as seen first to avoid duplicate notifications if webhook is slow
				seenGuids.add(guid);

				const content = String(item.content || item.contentSnippet || '');
				const resolved = /Status:\s*Resolved/i.test(content);
				const incident: Incident = {
					guid,
					title: String(item.title || 'OpenAI Status Update'),
					link: String(item.link || FEED_URL),
					content,
					publishedAt: new Date(item.isoDate || item.pubDate || Date.now()).toISOString(),
					resolved,
				};

				await dispatchToWebhook(options.webhookUrl, incident);
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('RSS poll error', err);
		} finally {
			isPolling = false;
		}
	}

	// Kick off immediately, then at interval
	pollOnce();
	setInterval(pollOnce, options.intervalMs);
}

async function dispatchToWebhook(webhookUrl: string, incident: Incident) {
	try {
		await fetch(webhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'incident', incident }),
		});
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Webhook dispatch error', err);
	}
}


