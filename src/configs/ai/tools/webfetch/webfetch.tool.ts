import { z } from "zod"
import type ITool from "../ITool"

const MAX_BYTES = 5 * 1024 * 1024
const TIMEOUT_MS = 30_000

const description = await Bun.file(new URL("./webfetch.tool.txt", import.meta.url)).text()

const parameters = z.object({
  url: z.string().describe("The URL to fetch"),
  format: z.enum(["markdown", "text"]).optional().default("markdown").describe("Output format"),
})

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim()
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, l, t) => `${"#".repeat(+l)} ${t.replace(/<[^>]+>/g, "").trim()}\n\n`)
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${text.replace(/<[^>]+>/g, "")}](${href})`)
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "_$1_")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const webfetchTool: ITool<typeof parameters> = {
  name: "webfetch",
  description,
  parameters,
  execute: async ({ url, format = "markdown" }) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)" },
      })

      if (!res.ok) return { error: `HTTP ${res.status}: ${res.statusText}` }

      const contentType = res.headers.get("content-type") ?? ""
      const isHtml = contentType.includes("text/html")

      const buffer = await res.arrayBuffer()
      if (buffer.byteLength > MAX_BYTES) return { error: `Response too large (${buffer.byteLength} bytes, max ${MAX_BYTES})` }

      const text = new TextDecoder().decode(buffer)
      const content = isHtml
        ? (format === "markdown" ? htmlToMarkdown(text) : htmlToText(text))
        : text

      return { content, url, contentType }
    } finally {
      clearTimeout(timeout)
    }
  },
}

export default webfetchTool
