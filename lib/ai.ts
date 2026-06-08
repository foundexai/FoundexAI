import { getCache, setCache, checkRateLimit } from "./redis"

export interface AICallOptions {
  prompt: string
  systemPrompt?: string
  model?: string
  temperature?: number
  responseFormat?: "json_object" | "text"
  cacheTtl?: number
  timeout?: number
}

export interface AICallResult {
  content: string
  provider: string
  model: string
  cached: boolean
}

interface ProviderConfig {
  name: string
  baseUrl: string
  apiKey: () => string | undefined
  defaultModel: string
  supportsJson: boolean
  headers: (key: string) => Record<string, string>
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: () => process.env.GROQ_API_KEY,
    defaultModel: "llama-3.3-70b-versatile",
    supportsJson: true,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  {
    name: "sambanova",
    baseUrl: "https://api.sambanova.ai/v1/chat/completions",
    apiKey: () => process.env.SAMBA_NOVA_API_KEY,
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    supportsJson: false,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  {
    name: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    apiKey: () => process.env.CEREBRAS_API_KEY,
    defaultModel: "gpt-oss-120b",
    supportsJson: true,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  {
    name: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: () => process.env.OPENROUTER_API_KEY2 || process.env.OPENROUTER_API_KEY,
    defaultModel: "openai/gpt-4o-mini",
    supportsJson: true,
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://foundex.ai",
      "X-Title": "Foundex MVP",
    }),
  },
]

function hashPrompt(prompt: string): string {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `ai:${Math.abs(hash).toString(36).slice(0, 16)}`
}

function extractJSON(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return text
}

export async function callAI(options: AICallOptions): Promise<AICallResult> {
  const {
    prompt,
    systemPrompt,
    responseFormat = "text",
    cacheTtl = 0,
    timeout = 15000,
  } = options

  if (cacheTtl > 0) {
    const cacheKey = hashPrompt(prompt)
    const cached = await getCache<AICallResult>(cacheKey)
    if (cached) {
      console.log(`[AI] cache hit — ${cached.provider} (${cached.model})`)
      return { ...cached, cached: true }
    }
  }

  for (const provider of PROVIDERS) {
    const apiKey = provider.apiKey()
    if (!apiKey) continue

    const rl = await checkRateLimit(`provider:${provider.name}`, 30, 60)
    if (!rl.allowed) {
      console.warn(`[AI] ${provider.name} rate limited, trying next...`)
      continue
    }

    const messages: { role: string; content: string }[] = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    const body: Record<string, unknown> = {
      model: options.model || provider.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
    }

    if (responseFormat === "json_object" && provider.supportsJson) {
      body.response_format = { type: "json_object" }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const res = await fetch(provider.baseUrl, {
        method: "POST",
        headers: provider.headers(apiKey),
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        console.warn(`[AI] ${provider.name} failed (${res.status}): ${errText.slice(0, 200)}`)
        continue
      }

      const data = await res.json()
      let content = data.choices?.[0]?.message?.content || ""

      if (responseFormat === "json_object" && !provider.supportsJson) {
        content = extractJSON(content)
      }

      const model = body.model as string
      console.log(`[AI] ${provider.name} (${model}) succeeded`)

      const result: AICallResult = {
        content,
        provider: provider.name,
        model,
        cached: false,
      }

      if (cacheTtl > 0 && result.content) {
        const cacheKey = hashPrompt(prompt)
        await setCache(cacheKey, result, cacheTtl)
      }

      return result
    } catch (err) {
      clearTimeout(timeoutId)
      console.warn(`[AI] ${provider.name} error:`, err)
      continue
    }
  }

  throw new Error("All AI providers failed")
}
