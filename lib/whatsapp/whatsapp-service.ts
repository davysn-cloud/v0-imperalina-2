/**
 * WhatsApp Integration Service
 * Supports Twilio and Evolution API providers
 */

interface WhatsAppMessage {
  to: string // Phone number in format +5521999999999
  message: string
  mediaUrl?: string
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  status?: string
  error?: string
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppViaTwilio(params: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error("Twilio credentials not configured")
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${whatsappNumber}`,
        To: `whatsapp:${params.to}`,
        Body: params.message,
        ...(params.mediaUrl && { MediaUrl: params.mediaUrl }),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Failed to send message")
    }

    return {
      success: true,
      messageId: data.sid,
      status: data.status,
    }
  } catch (error: any) {
    console.error("[v0] Twilio error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Send WhatsApp message via Evolution API
 */
async function sendWhatsAppViaEvolution(params: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    const apiUrl = process.env.EVOLUTION_API_URL
    const apiKey = process.env.EVOLUTION_API_KEY
    const instance = process.env.EVOLUTION_INSTANCE

    if (!apiUrl || !apiKey || !instance) {
      throw new Error("Evolution API credentials not configured")
    }

    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number: params.to.replace(/\D/g, ""), // Remove non-numeric characters
        text: params.message,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.key) {
      throw new Error(data.message || "Failed to send message")
    }

    return {
      success: true,
      messageId: data.key.id,
      status: "sent",
    }
  } catch (error: any) {
    console.error("[v0] Evolution API error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Main function to send WhatsApp message
 * Automatically selects provider based on environment variables
 */
export async function sendWhatsAppMessage(params: WhatsAppMessage): Promise<WhatsAppResponse> {
  const provider = process.env.WHATSAPP_PROVIDER || "twilio"

  console.log(`[v0] Sending WhatsApp via ${provider} to ${params.to}`)

  switch (provider) {
    case "twilio":
      return sendWhatsAppViaTwilio(params)
    case "evolution":
      return sendWhatsAppViaEvolution(params)
    default:
      return {
        success: false,
        error: `Unsupported WhatsApp provider: ${provider}`,
      }
  }
}

/**
 * Check message delivery status (Twilio only)
 */
export async function checkMessageStatus(messageId: string): Promise<string> {
  const provider = process.env.WHATSAPP_PROVIDER || "twilio"

  if (provider === "twilio") {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN

      if (!accountSid || !authToken) {
        return "unknown"
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageId}.json`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
        },
      )

      const data = await response.json()
      return data.status || "unknown"
    } catch (error) {
      console.error("[v0] Error checking message status:", error)
      return "unknown"
    }
  }

  return "unknown"
}
