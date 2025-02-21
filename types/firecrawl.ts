import { z } from 'zod'

// Schema for app data extraction
export const appDataSchema = z.object({
  app_name: z.string(),
  app_description: z.string(),
  app_logo_url: z.string()
})

// Type inference from the schema
export type AppData = z.infer<typeof appDataSchema>

// Firecrawl metadata type
export interface FirecrawlMetadata {
  title?: string
  description?: string
  ogImage?: string
  'og:image'?: string
  [key: string]: any
}

// Firecrawl schema type
export interface FirecrawlSchema {
  properties: {
    [key: string]: { description: string }
  }
  required: string[]
}

// Firecrawl extract options
export interface FirecrawlExtractOptions {
  prompt: string
  schema: FirecrawlSchema
}

// Firecrawl scrape options
export interface FirecrawlScrapeOptions {
  formats: string[]
  extract: FirecrawlExtractOptions
}

// Firecrawl response type
export interface FirecrawlResponse {
  success: boolean
  warning?: string
  error?: string
  metadata?: FirecrawlMetadata
  extract?: {
    app_name: string
    app_description: string
    app_logo_url: string
  }
}

// Type for the addApp function response
export interface AddAppResponse {
  success: boolean
  error?: string
  app?: any // Replace with proper app type if available
}
