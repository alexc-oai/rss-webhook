import type { StatusIncident } from "@/types/status"

export interface IncidentHistory {
  incident: StatusIncident
  timestamp: string
  changeType: "new" | "updated" | "resolved"
  previousStatus?: StatusIncident["status"]
}

export interface IncidentAlert {
  id: string
  type: "new_incident" | "status_change" | "resolved"
  incident: StatusIncident
  message: string
  timestamp: string
  severity: "low" | "medium" | "high" | "critical"
}

class IncidentTracker {
  private incidents: Map<string, StatusIncident> = new Map()
  private history: IncidentHistory[] = []
  private alerts: IncidentAlert[] = []

  public trackIncidents(newIncidents: StatusIncident[]): {
    incidents: StatusIncident[]
    newAlerts: IncidentAlert[]
    hasChanges: boolean
  } {
    const newAlerts: IncidentAlert[] = []
    const processedIncidents: StatusIncident[] = []
    let hasChanges = false

    // Process each incident
    for (const incident of newIncidents) {
      const existing = this.incidents.get(incident.id)

      if (!existing) {
        // New incident
        this.addIncidentHistory(incident, "new")
        const alert = this.createAlert(incident, "new_incident")
        newAlerts.push(alert)
        this.alerts.push(alert)
        hasChanges = true

        processedIncidents.push({ ...incident, isNew: true })
      } else {
        // Check for status changes
        if (existing.status !== incident.status) {
          this.addIncidentHistory(incident, "updated", existing.status)

          const alertType = incident.status === "resolved" ? "resolved" : "status_change"
          const alert = this.createAlert(incident, alertType)
          newAlerts.push(alert)
          this.alerts.push(alert)
          hasChanges = true
        }

        processedIncidents.push({ ...incident, isNew: false })
      }

      // Update stored incident
      this.incidents.set(incident.id, incident)
    }

    // Check for incidents that are no longer in the feed (auto-resolved)
    for (const [id, existing] of this.incidents.entries()) {
      const stillExists = newIncidents.some((inc) => inc.id === id)
      if (!stillExists && existing.status !== "resolved") {
        const resolvedIncident = { ...existing, status: "resolved" as const }
        this.addIncidentHistory(resolvedIncident, "resolved", existing.status)

        const alert = this.createAlert(resolvedIncident, "resolved")
        newAlerts.push(alert)
        this.alerts.push(alert)
        hasChanges = true

        this.incidents.set(id, resolvedIncident)
        processedIncidents.push(resolvedIncident)
      }
    }

    return {
      incidents: processedIncidents,
      newAlerts,
      hasChanges,
    }
  }

  private addIncidentHistory(
    incident: StatusIncident,
    changeType: IncidentHistory["changeType"],
    previousStatus?: StatusIncident["status"],
  ) {
    this.history.push({
      incident: { ...incident },
      timestamp: new Date().toISOString(),
      changeType,
      previousStatus,
    })

    // Keep only last 100 history entries
    if (this.history.length > 100) {
      this.history = this.history.slice(-100)
    }
  }

  private createAlert(incident: StatusIncident, type: IncidentAlert["type"]): IncidentAlert {
    const severity = this.getAlertSeverity(incident, type)
    const message = this.generateAlertMessage(incident, type)

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      incident: { ...incident },
      message,
      timestamp: new Date().toISOString(),
      severity,
    }
  }

  private getAlertSeverity(incident: StatusIncident, type: IncidentAlert["type"]): IncidentAlert["severity"] {
    if (type === "resolved") return "low"

    switch (incident.impact) {
      case "critical":
        return "critical"
      case "major":
        return "high"
      case "minor":
        return "medium"
      default:
        return "low"
    }
  }

  private generateAlertMessage(incident: StatusIncident, type: IncidentAlert["type"]): string {
    const components = incident.components.length > 0 ? ` affecting ${incident.components.join(", ")}` : ""

    switch (type) {
      case "new_incident":
        return `New ${incident.impact} incident: ${incident.title}${components}`
      case "status_change":
        return `Incident status changed to ${incident.status}: ${incident.title}${components}`
      case "resolved":
        return `Incident resolved: ${incident.title}${components}`
      default:
        return `Incident update: ${incident.title}${components}`
    }
  }

  public getRecentAlerts(limit = 10): IncidentAlert[] {
    return this.alerts.slice(-limit).reverse()
  }

  public getIncidentHistory(incidentId?: string): IncidentHistory[] {
    if (incidentId) {
      return this.history.filter((h) => h.incident.id === incidentId)
    }
    return this.history.slice(-50).reverse()
  }

  public clearOldAlerts(olderThanHours = 24) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString()
    this.alerts = this.alerts.filter((alert) => alert.timestamp > cutoff)
  }

  public getStats() {
    const activeIncidents = Array.from(this.incidents.values()).filter((inc) => inc.status !== "resolved")

    const criticalCount = activeIncidents.filter((inc) => inc.impact === "critical").length
    const majorCount = activeIncidents.filter((inc) => inc.impact === "major").length
    const minorCount = activeIncidents.filter((inc) => inc.impact === "minor").length

    return {
      totalIncidents: this.incidents.size,
      activeIncidents: activeIncidents.length,
      resolvedIncidents: this.incidents.size - activeIncidents.length,
      criticalCount,
      majorCount,
      minorCount,
      recentAlerts: this.alerts.length,
    }
  }
}

// Singleton instance
export const incidentTracker = new IncidentTracker()
