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

  // Design
  tattoo_style: string
  description: string
  reference_images: string[]
  is_cover_up: boolean
  cover_up_notes: string | null

  // Placement
  body_part: string
  placement_detail: string | null
  size_category: string
  size_notes: string | null

  // Session
  is_first_tattoo: boolean
  preferred_date: string | null
  time_preference: string | null
  budget_range: string | null

  // Extra
  additional_notes: string | null

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
