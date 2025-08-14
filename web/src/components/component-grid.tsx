import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle, Minus } from "lucide-react"
import { StatusIndicator } from "@/components/status-indicator"
import { cn } from "@/lib/utils"
import type { StatusComponent } from "@/types/status"

interface ComponentGridProps {
  components: StatusComponent[]
}

export function ComponentGrid({ components }: ComponentGridProps) {
  const statusConfig = {
    operational: {
      icon: CheckCircle,
      text: "Operational",
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
      borderColor: "border-green-200",
      variant: "secondary" as const,
    },
    degraded_performance: {
      icon: AlertCircle,
      text: "Degraded",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 hover:bg-yellow-100",
      borderColor: "border-yellow-200",
      variant: "secondary" as const,
    },
    partial_outage: {
      icon: Minus,
      text: "Partial Outage",
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
      borderColor: "border-orange-200",
      variant: "destructive" as const,
    },
    major_outage: {
      icon: XCircle,
      text: "Major Outage",
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
      borderColor: "border-red-200",
      variant: "destructive" as const,
    },
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">System Components</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {components.map((component) => {
          const config = statusConfig[component.status]
          const StatusIcon = config.icon
          const isOperational = component.status === "operational"

          return (
            <Card
              key={component.name}
              className={cn(
                "hover:shadow-md transition-all duration-300 transform hover:scale-105",
                config.bgColor,
                config.borderColor,
                "border-2",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{component.name}</CardTitle>
                  <StatusIndicator status={component.status} size="md" animated={!isOperational} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  <Badge
                    variant={config.variant}
                    className={cn("transition-all duration-300", !isOperational && "animate-pulse")}
                  >
                    {config.text}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
