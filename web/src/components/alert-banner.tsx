"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Bell, AlertTriangle, Info, CheckCircle } from "lucide-react"

interface AlertData {
  id: string
  type: "new_incident" | "status_change" | "resolved"
  message: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
}

export function AlertBanner() {
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/alerts?limit=5")
        const data = await response.json()
        setAlerts(data.alerts || [])
      } catch (error) {
        console.error("Failed to fetch alerts:", error)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 15000)
    return () => clearInterval(interval)
  }, [])

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id))

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
  }

  const getAlertConfig = (severity: string, type: string) => {
    const configs = {
      critical: {
        variant: "destructive" as const,
        icon: AlertTriangle,
        bgColor: "bg-red-50 border-red-200",
      },
      high: {
        variant: "destructive" as const,
        icon: AlertTriangle,
        bgColor: "bg-orange-50 border-orange-200",
      },
      medium: {
        variant: "default" as const,
        icon: Bell,
        bgColor: "bg-yellow-50 border-yellow-200",
      },
      low: {
        variant: "default" as const,
        icon: type === "resolved" ? CheckCircle : Info,
        bgColor: type === "resolved" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200",
      },
    }

    return configs[severity as keyof typeof configs] || configs.low
  }

  if (visibleAlerts.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {visibleAlerts.map((alert) => {
        const config = getAlertConfig(alert.severity, alert.type)
        const AlertIcon = config.icon

        return (
          <Alert key={alert.id} variant={config.variant} className={config.bgColor}>
            <AlertIcon className="h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <AlertDescription className="font-medium">{alert.message}</AlertDescription>
                <Badge variant="outline" className="text-xs">
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
