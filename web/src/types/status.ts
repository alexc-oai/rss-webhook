export interface StatusIncident {
  id: string
  title: string
  description: string
  status: "investigating" | "identified" | "monitoring" | "resolved"
  impact: "none" | "minor" | "major" | "critical"
  components: string[]
  createdAt: string
  updatedAt: string
  isNew?: boolean
}

export interface StatusComponent {
  name: string
  status: "operational" | "degraded_performance" | "partial_outage" | "major_outage"
}

export interface StatusFeed {
  incidents: StatusIncident[]
  components: StatusComponent[]
  lastUpdated: string
}
