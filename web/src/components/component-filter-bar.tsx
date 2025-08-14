"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getComponentColor } from "@/lib/component-colors"
import type { StatusIncident } from "@/types/status"

interface ComponentFilterBarProps {
  incidents: StatusIncident[]
  selectedComponents: string[]
  onComponentToggle: (component: string) => void
  onClearFilters: () => void
}

export function ComponentFilterBar({
  incidents,
  selectedComponents,
  onComponentToggle,
  onClearFilters,
}: ComponentFilterBarProps) {
  // Get all unique components from incidents
  const allComponents = Array.from(new Set(incidents.flatMap((incident) => incident.components))).sort()

  // Count incidents per component
  const componentCounts = allComponents.reduce(
    (acc, component) => {
      acc[component] = incidents.filter((incident) => incident.components.includes(component)).length
      return acc
    },
    {} as Record<string, number>,
  )

  if (allComponents.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filter by Component</h3>
        {selectedComponents.length > 0 && (
          <button
            onClick={onClearFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allComponents.map((component) => {
          const colors = getComponentColor(component)
          const isSelected = selectedComponents.includes(component)
          const count = componentCounts[component]

          return (
            <button
              key={component}
              onClick={() => onComponentToggle(component)}
              className="transition-all duration-200"
            >
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isSelected ? colors.active : `${colors.bg} ${colors.border} ${colors.text} ${colors.hover}`,
                )}
              >
                {component} ({count})
              </Badge>
            </button>
          )
        })}
      </div>
    </div>
  )
}
