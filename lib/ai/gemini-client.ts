import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is required")
}

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

export const AI_MODEL = "gemini-1.5-pro"

export function getGenerativeModel() {
  return genAI.getGenerativeModel({
    model: AI_MODEL,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  })
}
