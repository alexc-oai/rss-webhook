export const COMPONENT_COLORS = {
  ChatGPT: {
    bg: "bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-800",
    hover: "hover:bg-blue-200",
    active: "bg-blue-500 text-white border-blue-500",
  },
  API: {
    bg: "bg-green-100",
    border: "border-green-300",
    text: "text-green-800",
    hover: "hover:bg-green-200",
    active: "bg-green-500 text-white border-green-500",
  },
  Playground: {
    bg: "bg-purple-100",
    border: "border-purple-300",
    text: "text-purple-800",
    hover: "hover:bg-purple-200",
    active: "bg-purple-500 text-white border-purple-500",
  },
  Sora: {
    bg: "bg-orange-100",
    border: "border-orange-300",
    text: "text-orange-800",
    hover: "hover:bg-orange-200",
    active: "bg-orange-500 text-white border-orange-500",
  },
  General: {
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-800",
    hover: "hover:bg-gray-200",
    active: "bg-gray-500 text-white border-gray-500",
  },
} as const

export function getComponentColor(componentName: string) {
  return COMPONENT_COLORS[componentName as keyof typeof COMPONENT_COLORS] || COMPONENT_COLORS.General
}
