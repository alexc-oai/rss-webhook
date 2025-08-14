import { cn } from "@/lib/utils"

interface SeverityBarProps {
  impact: "none" | "minor" | "major" | "critical"
  className?: string
}

export function SeverityBar({ impact, className }: SeverityBarProps) {
  const severityConfig = {
    none: {
      width: "w-1/4",
      color: "bg-gray-300",
      label: "No Impact",
    },
    minor: {
      width: "w-2/4",
      color: "bg-yellow-400",
      label: "Minor Impact",
    },
    major: {
      width: "w-3/4",
      color: "bg-orange-500",
      label: "Major Impact",
    },
    critical: {
      width: "w-full",
      color: "bg-red-500",
      label: "Critical Impact",
    },
  }

  const config = severityConfig[impact]

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-muted-foreground">Impact Level</span>
        <span className="text-xs font-medium">{config.label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500 ease-out", config.color, config.width)} />
      </div>
    </div>
  )
}
