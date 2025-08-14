import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { StatusIndicator } from "@/components/status-indicator"
import { cn } from "@/lib/utils"
import type { StatusIncident } from "@/types/status"

interface StatusHeaderProps {
  incidents: StatusIncident[]
  lastUpdated: string
}

export function StatusHeader({ incidents, lastUpdated }: StatusHeaderProps) {
  const activeIncidents = incidents.filter((i) => i.status !== "resolved")
  const hasActiveIncidents = activeIncidents.length > 0

  const getOverallStatus = () => {
    if (!hasActiveIncidents) return "operational"

    const hasCritical = activeIncidents.some((i) => i.impact === "critical")
    const hasMajor = activeIncidents.some((i) => i.impact === "major")

    if (hasCritical) return "critical"
    if (hasMajor) return "major"
    return "minor"
  }

  const overallStatus = getOverallStatus()

  const statusConfig = {
    operational: {
      icon: CheckCircle,
      text: "All Systems Operational",
      color: "text-green-600",
      bgColor: "bg-gradient-to-r from-green-50 to-green-100",
      borderColor: "border-green-200",
      glowColor: "shadow-green-500/20",
    },
    minor: {
      icon: AlertCircle,
      text: "Minor Issues Detected",
      color: "text-yellow-600",
      bgColor: "bg-gradient-to-r from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      glowColor: "shadow-yellow-500/20",
    },
    major: {
      icon: AlertCircle,
      text: "Major Issues Detected",
      color: "text-orange-600",
      bgColor: "bg-gradient-to-r from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      glowColor: "shadow-orange-500/20",
    },
    critical: {
      icon: XCircle,
      text: "Critical Issues Detected",
      color: "text-red-600",
      bgColor: "bg-gradient-to-r from-red-50 to-red-100",
      borderColor: "border-red-200",
      glowColor: "shadow-red-500/20",
    },
  }

  const config = statusConfig[overallStatus]
  const StatusIcon = config.icon
  const isOperational = overallStatus === "operational"

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">OpenAI Status</h1>
        <p className="text-muted-foreground">Current status of OpenAI services and APIs</p>
      </div>

      <Card
        className={cn(
          "border-2 transition-all duration-500 hover:shadow-lg",
          config.bgColor,
          config.borderColor,
          config.glowColor,
          !isOperational && "animate-pulse shadow-lg",
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <StatusIndicator status={overallStatus as any} size="lg" animated={!isOperational} />
            <div className="text-center">
              <h2 className={cn("text-2xl font-semibold transition-colors duration-300", config.color)}>
                {config.text}
              </h2>
              {hasActiveIncidents && (
                <p className="text-sm text-muted-foreground mt-1 animate-fade-in">
                  {activeIncidents.length} active incident{activeIncidents.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <StatusIcon className={cn("h-8 w-8 transition-all duration-300", config.color)} />
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
