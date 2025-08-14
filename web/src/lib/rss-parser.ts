import type { StatusIncident, StatusComponent } from "@/types/status"

function cleanHtmlContent(html: string): string {
  // Remove CDATA wrapper if present
  let cleaned = html.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")

  // Remove duplicate "Affected components" sections since we show them separately
  cleaned = cleaned.replace(/<b>Affected components<\/b>[\s\S]*?<\/ul>/gi, "")
  cleaned = cleaned.replace(/Affected components[\s\S]*?<\/ul>/gi, "")

  // Clean up extra whitespace and line breaks
  cleaned = cleaned.replace(/\s+/g, " ").trim()

  return cleaned
}

export async function parseOpenAIStatusFeed(): Promise<{
  incidents: StatusIncident[]
  components: StatusComponent[]
}> {
  try {
    const response = await fetch("https://status.openai.com/feed.rss", {
      headers: {
        "User-Agent": "OpenAI-Status-Dashboard/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const xmlText = await response.text()

    // Parse RSS XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, "text/xml")

    const items = xmlDoc.querySelectorAll("item")
    const incidents: StatusIncident[] = []

    items.forEach((item, index) => {
      const title = item.querySelector("title")?.textContent || ""
      const description = item.querySelector("description")?.textContent || ""
      const pubDate = item.querySelector("pubDate")?.textContent || ""
      const guid = item.querySelector("guid")?.textContent || `incident-${index}`

      // Extract status and impact from title/description
      const status = extractStatus(title, description)
      const impact = extractImpact(title, description)
      const components = extractComponents(title, description)

      incidents.push({
        id: guid,
        title: title.trim(),
        description: cleanHtmlContent(description), // clean HTML content
        status,
        impact,
        components,
        createdAt: pubDate,
        updatedAt: pubDate,
      })
    })

    // Mock components for now - in a real implementation, this would come from a separate API
    const components: StatusComponent[] = [
      { name: "ChatGPT", status: "operational" },
      { name: "API", status: "operational" },
      { name: "Playground", status: "operational" },
      { name: "Sora", status: "operational" },
    ]

    return { incidents, components }
  } catch (error) {
    console.error("Error parsing RSS feed:", error)
    return { incidents: [], components: [] }
  }
}

function extractStatus(title: string, description: string): StatusIncident["status"] {
  const text = (title + " " + description).toLowerCase()

  if (text.includes("resolved") || text.includes("fixed")) return "resolved"
  if (text.includes("monitoring")) return "monitoring"
  if (text.includes("identified")) return "identified"
  return "investigating"
}

function extractImpact(title: string, description: string): StatusIncident["impact"] {
  const text = (title + " " + description).toLowerCase()

  if (text.includes("critical") || text.includes("major outage")) return "critical"
  if (text.includes("major") || text.includes("significant")) return "major"
  if (text.includes("minor") || text.includes("degraded")) return "minor"
  return "none"
}

function extractComponents(title: string, description: string): string[] {
  const text = (title + " " + description).toLowerCase()
  const components: string[] = []

  if (text.includes("chatgpt") || text.includes("chat")) components.push("ChatGPT")
  if (text.includes("api")) components.push("API")
  if (text.includes("playground")) components.push("Playground")
  if (text.includes("sora")) components.push("Sora")

  return components.length > 0 ? components : ["General"]
}
