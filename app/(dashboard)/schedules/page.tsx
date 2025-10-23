import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ScheduleManager } from "@/components/schedule-manager"

export default async function SchedulesPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  // Get professionals list (for admin) or current professional (for professional role)
  let professionals = []
  if (userData?.role === "ADMIN") {
    const { data } = await supabase
      .from("professionals")
      .select(`
        id,
        user:users(name)
      `)
      .order("created_at", { ascending: false })
    professionals = data || []
  } else if (userData?.role === "PROFESSIONAL") {
    const { data } = await supabase
      .from("professionals")
      .select(`
        id,
        user:users(name)
      `)
      .eq("user_id", user.id)
      .maybeSingle()
    professionals = data ? [data] : []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Horários de Atendimento</h1>
        <p className="text-muted-foreground">Configure os horários disponíveis para agendamento</p>
      </div>

      <ScheduleManager professionals={professionals} userRole={userData?.role || "CLIENT"} />
    </div>
  )
}
