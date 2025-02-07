import { z } from 'zod'

// Schema for app data extraction
export const appDataSchema = z.object({
  app_name: z.string(),
  app_description: z.string(),
  app_logo_url: z.string()
})

// Type inference from the schema
export type AppData = z.infer<typeof appDataSchema>

// Firecrawl response type
export interface FirecrawlResponse {
  success: boolean
  data?: AppData
  error?: string
}
