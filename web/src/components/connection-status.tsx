"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import type { ConnectionStatus } from "@/lib/websocket-manager"

interface ConnectionStatusProps {
  status: ConnectionStatus
  lastUpdated: string | null
  onRefresh?: () => void
}

export function ConnectionStatus({ status, lastUpdated, onRefresh }: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      icon: Wifi,
      text: "Connected",
      variant: "secondary" as const,
      color: "text-green-600",
    },
    connecting: {
      icon: Loader2,
      text: "Connecting",
      variant: "secondary" as const,
      color: "text-blue-600",
      animate: true,
    },
    disconnected: {
      icon: WifiOff,
      text: "Disconnected",
      variant: "outline" as const,
      color: "text-gray-600",
    },
    error: {
      icon: AlertTriangle,
      text: "Connection Error",
      variant: "destructive" as const,
      color: "text-red-600",
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  const formatLastUpdated = (timestamp: string | null) => {
    if (!timestamp) return "Never"

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)

    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    return date.toLocaleTimeString()
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center space-x-3">
        <StatusIcon className={`h-4 w-4 ${config.color} ${'animate' in config ? "animate-spin" : ""}`} />
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Badge variant={config.variant} className="text-xs">
              {config.text}
            </Badge>
            <span className="text-xs text-muted-foreground">Last updated: {formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 w-8 p-0"
          disabled={status === "connecting"}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
