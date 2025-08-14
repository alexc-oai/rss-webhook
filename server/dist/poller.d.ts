type Incident = {
    guid: string;
    title: string;
    link: string;
    content: string;
    publishedAt: string;
    resolved: boolean;
};
type StartOptions = {
    intervalMs: number;
    onIncident: (incident: Incident) => void | Promise<void>;
};
export declare function startRssPoller(options: StartOptions): void;
export {};
//# sourceMappingURL=poller.d.ts.map