import { useState, useEffect, useCallback, useRef } from "react"
import { wsManager, type ConnectionStatus } from "@/lib/websocket-manager"
import type { StatusFeed } from "@/types/status"

export function useStatus() {
  const [status, setStatus] = useState<StatusFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const retryCount = useRef(0)
  const maxRetries = 3
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchStatus = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) setLoading(true)

      const response = await fetch("/api/status", {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setStatus(data)
      setError(null)
      setLastUpdated(new Date().toISOString())
      retryCount.current = 0

      console.log("Status updated:", {
        incidents: data.incidents?.length || 0,
        hasChanges: data.meta?.hasChanges,
        newAlerts: data.meta?.newAlertsCount || 0,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      console.error("Status fetch error:", errorMessage)

      // Implement exponential backoff for retries
      if (retryCount.current < maxRetries) {
        retryCount.current++
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 10000)

      setTimeout(() => {
          fetchStatus(true)
        }, delay)

        return
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const startPolling = useCallback(() => {
    // Clear existing interval
    if (pollInterval.current) {
      clearInterval(pollInterval.current)
    }

    // Start new polling interval
    pollInterval.current = setInterval(() => {
      fetchStatus(true)
    }, 15000)
  }, [fetchStatus])

  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current)
      pollInterval.current = null
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchStatus()

    // Start WebSocket connection
    wsManager.connect()

    // Subscribe to WebSocket messages
    wsManager.subscribe("status-hook", (message) => {
      if (message.type === "status_update") {
        // Fetch latest data when WebSocket notifies of updates
        fetchStatus(true)
      }
    })

    // Subscribe to connection status changes
    const unsubscribeStatus = wsManager.onStatusChange(setConnectionStatus)

    // Start polling as fallback
    startPolling()

    // Cleanup on unmount
    return () => {
      stopPolling()
      wsManager.unsubscribe("status-hook")
      unsubscribeStatus()
    }
  }, [fetchStatus, startPolling, stopPolling])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        fetchStatus(true)
        startPolling()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [fetchStatus, startPolling, stopPolling])

  const refetch = useCallback(() => {
    retryCount.current = 0
    fetchStatus()
  }, [fetchStatus])

  return {
    status,
    loading,
    error,
    connectionStatus,
    lastUpdated,
    refetch,
  }
}
