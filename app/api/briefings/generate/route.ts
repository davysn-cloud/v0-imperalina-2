import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { generateAIBriefing } from "@/lib/ai/briefing-generator"
import { getClientHistory, getClientProfile } from "@/lib/ai/client-history"

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json()

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        client_id,
        professional_id,
        service_id,
        date,
        start_time,
        client:users!appointments_client_id_fkey(id, name, email, phone),
        professional:professionals(id, user:users(name)),
        service:services(name, duration, price)
      `,
      )
      .eq("id", appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Check if briefing already exists
    const { data: existingBriefing } = await supabase
      .from("ai_briefings")
      .select("id")
      .eq("appointment_id", appointmentId)
      .single()

    if (existingBriefing) {
      return NextResponse.json({ error: "Briefing already exists for this appointment" }, { status: 409 })
    }

    // Get client history and profile
    const [clientHistory, clientProfile] = await Promise.all([
      getClientHistory(appointment.client_id),
      getClientProfile(appointment.client_id),
    ])

    // Generate briefing with AI
    const briefingData = await generateAIBriefing({
      client: {
        name: appointment.client.name,
        email: appointment.client.email,
        phone: appointment.client.phone,
      },
      clientProfile,
      previousVisits: clientHistory,
      upcomingService: {
        name: appointment.service.name,
        duration: appointment.service.duration,
        price: appointment.service.price,
      },
      professional: {
        name: appointment.professional.user.name,
      },
    })

    // Save briefing to database
    const { data: savedBriefing, error: saveError } = await supabase
      .from("ai_briefings")
      .insert({
        appointment_id: appointmentId,
        professional_id: appointment.professional_id,
        client_id: appointment.client_id,
        briefing_content: briefingData.content,
        briefing_summary: briefingData.summary,
        key_topics: briefingData.keyTopics,
        preferences: briefingData.preferences,
        last_visit_summary: briefingData.lastVisitSummary,
        suggested_topics: briefingData.suggestedTopics,
        alerts: briefingData.alerts,
        reminders: briefingData.reminders,
        tokens_used: briefingData.tokensUsed,
        generation_time: briefingData.generationTime,
        whatsapp_status: "QUEUED",
      })
      .select()
      .single()

    if (saveError) throw saveError

    return NextResponse.json({
      success: true,
      briefing: savedBriefing,
    })
  } catch (error: any) {
    console.error("[v0] Error generating briefing:", error)
    return NextResponse.json({ error: "Failed to generate briefing", details: error.message }, { status: 500 })
  }
}
