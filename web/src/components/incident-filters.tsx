import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface IncidentFiltersProps {
  showResolved: boolean
  onFilterChange: (showResolved: boolean) => void
  activeCount: number
  resolvedCount: number
}

export function IncidentFilters({ showResolved, onFilterChange, activeCount, resolvedCount }: IncidentFiltersProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Filter incidents:</span>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant={!showResolved ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(false)}
          className={cn("transition-all duration-200", !showResolved && "bg-orange-500 hover:bg-orange-600")}
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Current
          <Badge variant="secondary" className={cn("ml-2 text-xs", !showResolved && "bg-orange-100 text-orange-800")}>
            {activeCount}
          </Badge>
        </Button>

        <Button
          variant={showResolved ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(true)}
          className="transition-all duration-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          All
          <Badge variant="secondary" className="ml-2 text-xs">
            {activeCount + resolvedCount}
          </Badge>
        </Button>
      </div>
    </div>
  )
}
