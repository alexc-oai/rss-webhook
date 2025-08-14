import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status:
    | "operational"
    | "degraded_performance"
    | "partial_outage"
    | "major_outage"
    | "investigating"
    | "identified"
    | "monitoring"
    | "resolved"
  size?: "sm" | "md" | "lg"
  animated?: boolean
  className?: string
}

export function StatusIndicator({ status, size = "md", animated = false, className }: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  const statusConfig = {
    operational: {
      color: "bg-green-500",
      ring: "ring-green-500/20",
      glow: "shadow-green-500/50",
    },
    degraded_performance: {
      color: "bg-yellow-500",
      ring: "ring-yellow-500/20",
      glow: "shadow-yellow-500/50",
    },
    partial_outage: {
      color: "bg-orange-500",
      ring: "ring-orange-500/20",
      glow: "shadow-orange-500/50",
    },
    major_outage: {
      color: "bg-red-500",
      ring: "ring-red-500/20",
      glow: "shadow-red-500/50",
    },
    investigating: {
      color: "bg-red-500",
      ring: "ring-red-500/20",
      glow: "shadow-red-500/50",
    },
    identified: {
      color: "bg-orange-500",
      ring: "ring-orange-500/20",
      glow: "shadow-orange-500/50",
    },
    monitoring: {
      color: "bg-blue-500",
      ring: "ring-blue-500/20",
      glow: "shadow-blue-500/50",
    },
    resolved: {
      color: "bg-green-500",
      ring: "ring-green-500/20",
      glow: "shadow-green-500/50",
    },
  }

  const config = statusConfig[status]

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full transition-all duration-300",
          sizeClasses[size],
          config.color,
          animated && "animate-pulse",
          animated && `ring-4 ${config.ring}`,
          animated && `shadow-lg ${config.glow}`,
        )}
      />
      {animated && (
        <div className={cn("absolute rounded-full animate-ping", sizeClasses[size], config.color, "opacity-75")} />
      )}
    </div>
  )
}
