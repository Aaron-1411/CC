export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'waitlist'

export interface Booking {
  id: string
  created_at: string
  updated_at: string

  // Contact
  name: string
  email: string
  phone: string | null
  instagram: string | null
  is_returning_client: boolean

  // Design
  is_flash: boolean
  tattoo_style: string
  colour_preference: string | null
  complexity: string | null
  skin_tone: string | null
  description: string
  reference_images: string[]
  is_cover_up: boolean
  cover_up_notes: string | null
  cover_up_darkness: string | null

  // Placement
  body_part: string
  placement_detail: string | null
  size_category: string
  dimensions: string | null
  size_notes: string | null

  // Session
  is_first_tattoo: boolean
  preferred_date: string | null
  time_preference: string | null
  budget_range: string | null
  has_deadline: string | null
  join_waitlist: boolean

  // Extra
  additional_notes: string | null
  has_medical_condition: boolean
  referral_source: string | null

  // Admin
  status: BookingStatus
  admin_notes: string | null
}

export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status' | 'admin_notes'>

export interface PortfolioImage {
  id: string
  created_at: string
  url: string
  style_tag: string | null
  body_part_tag: string | null
  caption: string | null
  display_order: number
  featured: boolean
}
