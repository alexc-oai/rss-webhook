import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Eye, Search } from "lucide-react"
import { StatusIndicator } from "@/components/status-indicator"
import { SeverityBar } from "@/components/severity-bar"
import { cn } from "@/lib/utils"
import type { StatusIncident } from "@/types/status"
import { getComponentColor } from "@/lib/component-colors"

interface IncidentListProps {
  incidents: StatusIncident[]
  showResolved?: boolean
}

export function IncidentList({ incidents, showResolved = true }: IncidentListProps) {
  const statusConfig = {
    investigating: {
      icon: Search,
      text: "Investigating",
      variant: "destructive" as const,
      color: "text-red-600",
    },
    identified: {
      icon: AlertCircle,
      text: "Identified",
      variant: "destructive" as const,
      color: "text-orange-600",
    },
    monitoring: {
      icon: Eye,
      text: "Monitoring",
      variant: "secondary" as const,
      color: "text-blue-600",
    },
    resolved: {
      icon: CheckCircle,
      text: "Resolved",
      variant: "outline" as const,
      color: "text-green-600",
    },
  }

  const impactConfig = {
    none: { text: "No Impact", variant: "outline" as const },
    minor: { text: "Minor", variant: "secondary" as const },
    major: { text: "Major", variant: "destructive" as const },
    critical: { text: "Critical", variant: "destructive" as const },
  }

  const filteredIncidents = showResolved ? incidents : incidents.filter((incident) => incident.status !== "resolved")

  if (filteredIncidents.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Recent Incidents</h2>
        <Card className="bg-green-50 border-green-200 border-2">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="relative mb-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <div className="absolute inset-0 animate-ping">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto opacity-75" />
                </div>
              </div>
              <p className="text-lg font-medium text-foreground">
                {showResolved ? "No incidents reported" : "No active incidents"}
              </p>
              <p className="text-muted-foreground">
                {showResolved ? "All systems are running smoothly" : "All current issues have been resolved"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Recent Incidents</h2>

      <div className="space-y-4">
        {filteredIncidents.map((incident) => {
          const statusConf = statusConfig[incident.status]
          const impactConf = impactConfig[incident.impact]
          const StatusIcon = statusConf.icon
          const isActive = incident.status !== "resolved"
          const isNew = incident.isNew

          return (
            <Card
              key={incident.id}
              className={cn(
                "transition-all duration-300 hover:shadow-lg",
                isNew && "ring-2 ring-orange-500 ring-opacity-50 animate-pulse",
                isActive && "border-l-4 border-l-orange-500",
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <StatusIndicator status={incident.status} size="lg" animated={isActive} />
                      <CardTitle className="text-lg flex-1">{incident.title}</CardTitle>
                      {isNew && (
                        <Badge variant="destructive" className="bg-orange-500 animate-bounce">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`h-4 w-4 ${statusConf.color}`} />
                      <Badge
                        variant={statusConf.variant}
                        className={cn("transition-all duration-300", isActive && "animate-pulse")}
                      >
                        {statusConf.text}
                      </Badge>
                      <Badge
                        variant={impactConf.variant}
                        className={cn(
                          "transition-all duration-300",
                          incident.impact === "critical" && "animate-pulse bg-red-600",
                        )}
                      >
                        {impactConf.text}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className="text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: incident.description }}
                  />

                  {incident.impact !== "none" && <SeverityBar impact={incident.impact} />}

                  {incident.components.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Affected components:</span>
                      <div className="flex flex-wrap gap-1">
                        {incident.components.map((component) => {
                          const colors = getComponentColor(component) // use unique colors per component
                          return (
                            <Badge
                              key={component}
                              variant="outline"
                              className={cn(
                                "text-xs transition-all duration-300",
                                isActive && `${colors.bg} ${colors.border} ${colors.text}`,
                                !isActive && "border-green-300 bg-green-50 text-green-700",
                              )}
                            >
                              {component}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(incident.createdAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
