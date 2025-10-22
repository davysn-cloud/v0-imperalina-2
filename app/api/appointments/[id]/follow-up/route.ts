import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const followUpSchema = z.object({
  serviceReason: z.string().optional(),
  eventDate: z.string().optional(),
  eventImportance: z.enum(["ROUTINE", "IMPORTANT", "VERY_IMPORTANT", "CRITICAL"]).optional(),
  conversationTopics: z.array(z.string()).optional(),
  personalMilestones: z.array(z.string()).optional(),
  followUpTopics: z.array(z.string()).optional(),
  reminders: z.array(z.string()).optional(),
  clientSatisfaction: z.number().min(1).max(5).optional(),
  serviceQuality: z.enum(["POOR", "FAIR", "GOOD", "VERY_GOOD", "EXCELLENT"]).optional(),
  clientFeedback: z.string().optional(),
  productsUsed: z.array(z.string()).optional(),
  productsRecommended: z.array(z.string()).optional(),
  technicalNotes: z.string().optional(),
  nextServiceSuggestion: z.string().optional(),
  profileUpdates: z.record(z.any()).optional(),
  completedBy: z.string(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase.from("appointment_follow_ups").select("*").eq("appointment_id", id).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(data || null)
  } catch (error: any) {
    console.error("[v0] Error fetching follow-up:", error)
    return NextResponse.json({ error: "Failed to fetch follow-up" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const validatedData = followUpSchema.parse(body)

    // Check if appointment exists
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Convert camelCase to snake_case for database
    const dbData = {
      appointment_id: id,
      service_reason: validatedData.serviceReason,
      event_date: validatedData.eventDate,
      event_importance: validatedData.eventImportance,
      conversation_topics: validatedData.conversationTopics || [],
      personal_milestones: validatedData.personalMilestones || [],
      follow_up_topics: validatedData.followUpTopics || [],
      reminders: validatedData.reminders || [],
      client_satisfaction: validatedData.clientSatisfaction,
      service_quality: validatedData.serviceQuality,
      client_feedback: validatedData.clientFeedback,
      products_used: validatedData.productsUsed || [],
      products_recommended: validatedData.productsRecommended || [],
      technical_notes: validatedData.technicalNotes,
      next_service_suggestion: validatedData.nextServiceSuggestion,
      profile_updates: validatedData.profileUpdates,
      completed_at: new Date().toISOString(),
      completed_by: validatedData.completedBy,
    }

    // Upsert follow-up
    const { data: followUp, error } = await supabase
      .from("appointment_follow_ups")
      .upsert(dbData, {
        onConflict: "appointment_id",
      })
      .select()
      .single()

    if (error) throw error

    // Update appointment status to COMPLETED
    await supabase.from("appointments").update({ status: "COMPLETED" }).eq("id", id)

    return NextResponse.json(followUp)
  } catch (error: any) {
    console.error("[v0] Error saving follow-up:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to save follow-up" }, { status: 500 })
  }
}
