export type UserRole = "CLIENT" | "PROFESSIONAL" | "ADMIN"
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

export interface User {
  id: string
  email: string
  name: string
  phone: string | null
  avatar: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  user_id: string
  specialties: string[]
  bio: string | null
  color: string
  is_active: boolean
  can_manage_schedule: boolean
  can_view_all_appointments: boolean
  created_at: string
  updated_at: string
  user?: User
  services?: Service[]
  schedules?: Schedule[]
}

export interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  professional_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  professional?: Professional
}

export interface Schedule {
  id: string
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
  updated_at: string
  professional?: Professional
}

export interface Appointment {
  id: string
  client_id: string
  professional_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  client?: User
  professional?: Professional
  service?: Service
}

export interface TimeSlot {
  time: string
  available: boolean
}

export type ClientMood = "VERY_HAPPY" | "HAPPY" | "NEUTRAL" | "TIRED" | "STRESSED" | "UPSET"
export type CoffeeStrength = "WEAK" | "MEDIUM" | "STRONG" | "VERY_STRONG"
export type EventImportance = "ROUTINE" | "IMPORTANT" | "VERY_IMPORTANT" | "CRITICAL"
export type ServiceQuality = "POOR" | "FAIR" | "GOOD" | "VERY_GOOD" | "EXCELLENT"

export interface FollowIn {
  id: string
  appointment_id: string
  client_mood?: ClientMood
  arrived_on_time?: boolean
  arrival_notes?: string
  coffee_today?: boolean
  coffee_strength_today?: CoffeeStrength
  music_today?: string
  temperature_today?: string
  special_requests?: string
  time_constraints?: string
  professional_notes?: string
  completed_at?: string
  completed_by?: string
  created_at: string
  updated_at: string
}

export interface FollowUp {
  id: string
  appointment_id: string
  service_reason?: string
  event_date?: string
  event_importance?: EventImportance
  conversation_topics?: string[]
  personal_milestones?: string[]
  follow_up_topics?: string[]
  reminders?: string[]
  client_satisfaction?: number
  service_quality?: ServiceQuality
  client_feedback?: string
  products_used?: string[]
  products_recommended?: string[]
  technical_notes?: string
  next_service_suggestion?: string
  profile_updates?: Record<string, any>
  completed_at?: string
  completed_by?: string
  created_at: string
  updated_at: string
}
