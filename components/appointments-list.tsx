"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, Briefcase, Edit, Trash2, Check, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { UserRole } from "@/lib/types"

interface Appointment {
  id: string
  date: string
  start_time: string
  end_time: string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
  notes?: string
  client: {
    name: string
    email: string
    phone?: string
  }
  professional: {
    id: string
    color: string
    user: {
      name: string
    }
  }
  service: {
    name: string
    duration: number
    price: number
  }
}

interface AppointmentsListProps {
  appointments: Appointment[]
  userRole: UserRole
}

const STATUS_LABELS = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "outline",
}

export function AppointmentsList({ appointments, userRole }: AppointmentsListProps) {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id)

    if (error) {
      toast.error("Erro ao atualizar status")
      return
    }

    toast.success("Status atualizado com sucesso")
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) {
      toast.error("Erro ao excluir agendamento")
      return
    }

    toast.success("Agendamento excluído com sucesso")
    router.refresh()
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {appointments.map((appointment) => {
        const appointmentDate = new Date(appointment.date + "T00:00:00")

        return (
          <Card key={appointment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: appointment.professional?.color || "#d97706" }}
                    />
                    <h3 className="font-semibold">{appointment.service.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(appointmentDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {appointment.start_time} - {appointment.end_time}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[appointment.status]}>{STATUS_LABELS[appointment.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {userRole === "CLIENT"
                      ? `Profissional: ${appointment.professional.user.name}`
                      : `Cliente: ${appointment.client.name}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {appointment.service.duration} min - R$ {appointment.service.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {appointment.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {userRole !== "CLIENT" && appointment.status === "PENDING" && (
                  <>
                    <Button size="sm" variant="default" onClick={() => updateStatus(appointment.id, "CONFIRMED")}>
                      <Check className="mr-2 h-4 w-4" />
                      Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(appointment.id, "CANCELLED")}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                )}
                {userRole !== "CLIENT" && appointment.status === "CONFIRMED" && (
                  <Button size="sm" variant="default" onClick={() => updateStatus(appointment.id, "COMPLETED")}>
                    <Check className="mr-2 h-4 w-4" />
                    Concluir
                  </Button>
                )}
                <Link href={`/appointments/${appointment.id}/edit`}>
                  <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => handleDelete(appointment.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
