import { z } from 'zod'

export const bookingSchema = z.object({
  // Contact
  name: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine(v => !v || /^[\d\s\+\-\(\)]{7,20}$/.test(v), 'Please enter a valid phone number'),
  instagram: z.string().optional(),

  // Design
  tattoo_style: z.string().min(1, 'Please select a tattoo style'),
  tattoo_style_notes: z.string().optional(),
  colour_preference: z.enum(
    ['Black & grey only', 'Full colour', 'Colour with black & grey shading', 'Not sure yet'],
    { error: 'Please select a colour preference' }
  ),
  complexity: z.enum(['simple', 'moderate', 'detailed'], {
    error: 'Please select a complexity level',
  }),
  description: z.string().min(50, 'Please describe your idea in at least 50 characters — the more detail the better'),
  reference_images: z.array(z.string()),
  is_cover_up: z.boolean(),
  cover_up_notes: z.string().optional(),
  cover_up_darkness: z.string().optional(),

  // Placement
  body_part: z.string().min(1, 'Please select a body part'),
  placement_detail: z.string().optional(),
  size_category: z.string().min(1, 'Please select a size'),
  dimensions: z.string().optional(),
  size_notes: z.string().optional(),

  // Session
  is_first_tattoo: z.boolean(),
  preferred_date: z
    .string()
    .optional()
    .refine(v => {
      if (!v) return true
      const date = new Date(v)
      const sixMonths = new Date()
      sixMonths.setMonth(sixMonths.getMonth() + 6)
      return date <= sixMonths
    }, 'Please choose a date within the next 6 months'),
  time_preference: z.string().optional(),
  budget_range: z.string().min(1, 'Please select a budget range — even "Not sure" helps Jordan plan'),

  // Extra
  additional_notes: z.string().optional(),
  consent: z.boolean().refine(val => val === true, 'You must confirm this is a request, not a confirmed booking'),
})

export type BookingFormValues = z.infer<typeof bookingSchema>

export const COLOUR_PREFERENCES = [
  'Black & grey only',
  'Full colour',
  'Colour with black & grey shading',
  'Not sure yet',
]

export const COMPLEXITY_OPTIONS = [
  { value: 'simple', label: 'Simple / minimal — clean lines, little shading' },
  { value: 'moderate', label: 'Moderate — some detail, shading or texture' },
  { value: 'detailed', label: 'Highly detailed — complex composition, fine detail' },
]

export const TATTOO_STYLES = [
  'Blackwork',
  'Fine Line',
  'Neo-Traditional',
  'Japanese',
  'Geometric',
  'Realism',
  'Illustrative',
  'Watercolour',
  'Tribal',
  'Traditional',
  'Minimalist',
  'Other',
]

export const BODY_PARTS = [
  'Arm',
  'Forearm',
  'Hand / Fingers',
  'Chest',
  'Upper Back',
  'Lower Back',
  'Rib / Side',
  'Stomach',
  'Shoulder',
  'Leg',
  'Thigh',
  'Calf',
  'Ankle / Foot',
  'Neck',
  'Behind Ear',
  'Head / Scalp',
  'Other',
]

export const SIZE_CATEGORIES = [
  { value: 'tiny', label: 'Tiny — under 3cm' },
  { value: 'small', label: 'Small — 3–8cm' },
  { value: 'medium', label: 'Medium — 8–15cm' },
  { value: 'large', label: 'Large — 15–25cm' },
  { value: 'xl', label: 'XL / Full piece — 25cm+' },
]

export const BUDGET_RANGES = [
  '£50–150',
  '£150–300',
  '£300–500',
  '£500–800',
  '£800+',
  'Not sure',
]

export const TIME_PREFERENCES = ['Morning', 'Afternoon', 'Evening', 'No preference']

export const COVER_UP_DARKNESS = [
  { value: 'light', label: 'Light — faded or lightly pigmented' },
  { value: 'medium', label: 'Medium — still clearly visible' },
  { value: 'dark', label: 'Dark / saturated — heavy black or bold colour' },
  { value: 'scarred', label: 'Scarred or raised — previous work has texture' },
]
