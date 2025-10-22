import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ServiceForm } from "@/components/service-form"
import { notFound } from "next/navigation"

export default async function EditServicePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await getSupabaseServerClient()

  const [{ data: service }, { data: professionals }] = await Promise.all([
    supabase.from("services").select("*").eq("id", params.id).single(),
    supabase.from("professionals").select(`
      id,
      user:users(name)
    `),
  ])

  if (!service) {
    notFound()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Serviço</h1>
        <p className="text-muted-foreground">Atualize as informações do serviço</p>
      </div>

      <ServiceForm professionals={professionals || []} service={service} />
    </div>
  )
}
