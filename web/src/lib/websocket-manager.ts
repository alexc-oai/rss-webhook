import type { StatusFeed } from "@/types/status"
import type { IncidentAlert } from "@/lib/incident-tracker"

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export interface WebSocketMessage {
  type: "status_update" | "new_alert" | "ping" | "pong"
  data?: StatusFeed | IncidentAlert
  timestamp: string
}

class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private connectionStatus: ConnectionStatus = "disconnected"
  private listeners: Map<string, (message: WebSocketMessage) => void> = new Map()
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set()

  public connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.setConnectionStatus("connecting")

    try {
      // In a real implementation, this would be your WebSocket server URL
      // For demo purposes, we'll simulate WebSocket behavior
      this.simulateWebSocketConnection()
    } catch (error) {
      console.error("WebSocket connection error:", error)
      this.setConnectionStatus("error")
      this.scheduleReconnect()
    }
  }

  private simulateWebSocketConnection() {
    // Simulate WebSocket connection for demo
    setTimeout(() => {
      this.setConnectionStatus("connected")
      this.reconnectAttempts = 0
      this.startPingInterval()

      // Simulate receiving updates every 30 seconds
      const updateInterval = setInterval(() => {
        if (this.connectionStatus === "connected") {
          this.notifyListeners({
            type: "status_update",
            timestamp: new Date().toISOString(),
          })
        } else {
          clearInterval(updateInterval)
        }
      }, 30000)
    }, 1000)
  }

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status
    this.statusListeners.forEach((listener) => listener(status))
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.connectionStatus === "connected") {
        // Simulate ping/pong
        this.notifyListeners({
          type: "ping",
          timestamp: new Date().toISOString(),
        })
      }
    }, 30000)
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionStatus("error")
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private notifyListeners(message: WebSocketMessage) {
    this.listeners.forEach((listener) => listener(message))
  }

  public subscribe(id: string, callback: (message: WebSocketMessage) => void) {
    this.listeners.set(id, callback)
  }

  public unsubscribe(id: string) {
    this.listeners.delete(id)
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusListeners.add(callback)
    return () => this.statusListeners.delete(callback)
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }

    this.setConnectionStatus("disconnected")
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }
}

export const wsManager = new WebSocketManager()
