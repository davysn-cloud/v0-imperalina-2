import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AppointmentForm } from "@/components/appointment-form"
import { notFound } from "next/navigation"

export default async function EditAppointmentPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await getSupabaseServerClient()

  const [{ data: appointment }, { data: professionals }, { data: services }, { data: clients }] = await Promise.all([
    supabase.from("appointments").select("*").eq("id", params.id).single(),
    supabase.from("professionals").select(`
      id,
      color,
      user:users(name)
    `),
    supabase.from("services").select("*").eq("is_active", true),
    supabase.from("users").select("id, name, email").eq("role", "CLIENT"),
  ])

  if (!appointment) {
    notFound()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Agendamento</h1>
        <p className="text-muted-foreground">Atualize as informações do agendamento</p>
      </div>

      <AppointmentForm
        professionals={professionals || []}
        services={services || []}
        clients={clients || []}
        appointment={appointment}
      />
    </div>
  )
}
