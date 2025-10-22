import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Briefcase, TrendingUp } from "lucide-react"
import { DashboardCalendar } from "@/components/dashboard-calendar"
import { RecentAppointments } from "@/components/recent-appointments"
import { startOfMonth, endOfMonth, format } from "date-fns"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Get statistics
  const [
    { count: appointmentsCount },
    { count: professionalsCount },
    { count: servicesCount },
    { count: monthAppointmentsCount },
  ] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("professionals").select("*", { count: "exact", head: true }),
    supabase.from("services").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("date", format(monthStart, "yyyy-MM-dd"))
      .lte("date", format(monthEnd, "yyyy-MM-dd")),
  ])

  // Get recent appointments
  const { data: recentAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      client:users!appointments_client_id_fkey(name, email),
      professional:professionals(
        color,
        user:users(name)
      ),
      service:services(name, duration)
    `)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(5)

  const stats = [
    {
      title: "Agendamentos Totais",
      value: appointmentsCount || 0,
      icon: Calendar,
      description: "Total de agendamentos",
    },
    {
      title: "Agendamentos do Mês",
      value: monthAppointmentsCount || 0,
      icon: TrendingUp,
      description: "Neste mês",
    },
    {
      title: "Profissionais",
      value: professionalsCount || 0,
      icon: Users,
      description: "Profissionais ativos",
    },
    {
      title: "Serviços",
      value: servicesCount || 0,
      icon: Briefcase,
      description: "Serviços disponíveis",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de agendamentos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCalendar />
        <RecentAppointments appointments={recentAppointments || []} />
      </div>
    </div>
  )
}
