'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { bookingSchema, type BookingFormValues, TATTOO_STYLES, BODY_PARTS, SIZE_CATEGORIES, BUDGET_RANGES, TIME_PREFERENCES } from '@/lib/validations/booking'
import { createClient } from '@/lib/supabase-browser'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

export default function BookingForm() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      reference_images: [],
      is_cover_up: false,
      is_first_tattoo: false,
      consent: false,
    },
  })

  const isCoverUp = watch('is_cover_up')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (uploadedImages.length + files.length > 5) {
      toast.error('Maximum 5 reference images')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('reference-images').upload(path, file)
      if (error) {
        toast.error(`Failed to upload ${file.name}`)
        continue
      }
      const { data } = supabase.storage.from('reference-images').getPublicUrl(path)
      newUrls.push(data.publicUrl)
    }

    const all = [...uploadedImages, ...newUrls]
    setUploadedImages(all)
    setValue('reference_images', all)
    setUploading(false)
  }

  function removeImage(url: string) {
    const updated = uploadedImages.filter(u => u !== url)
    setUploadedImages(updated)
    setValue('reference_images', updated)
  }

  async function onSubmit(data: BookingFormValues) {
    const { consent: _consent, ...payload } = data
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Something went wrong. Please try again.')
      return
    }

    router.push('/confirmation')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">

      {/* Contact */}
      <section>
        <SectionHeader title="Contact Details" subtitle="How Jordan can reach you." />
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="name">Full name *</Label>
            <Input id="name" {...register('name')} className="mt-1.5" placeholder="Your name" />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="email">Email address *</Label>
            <Input id="email" type="email" {...register('email')} className="mt-1.5" placeholder="you@example.com" />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" type="tel" {...register('phone')} className="mt-1.5" placeholder="+44 7700 000000" />
          </div>
          <div>
            <Label htmlFor="instagram">Instagram handle</Label>
            <Input id="instagram" {...register('instagram')} className="mt-1.5" placeholder="@yourhandle" />
          </div>
        </div>
      </section>

      {/* Design */}
      <section>
        <SectionHeader title="Your Design" subtitle="The more detail here, the better Jordan can estimate time and pricing." />
        <div className="space-y-5">
          <div>
            <Label htmlFor="tattoo_style">Tattoo style *</Label>
            <select
              id="tattoo_style"
              {...register('tattoo_style')}
              className="mt-1.5 w-full h-10 rounded-md border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a style</option>
              {TATTOO_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FieldError message={errors.tattoo_style?.message} />
          </div>

          <div>
            <Label htmlFor="description">Describe your tattoo idea *</Label>
            <Textarea
              id="description"
              {...register('description')}
              className="mt-1.5 min-h-[140px]"
              placeholder="Tell Jordan exactly what you have in mind — imagery, meanings, feelings, anything relevant. The more detail, the better."
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* Reference images */}
          <div>
            <Label>Reference images <span className="text-muted-foreground font-normal">(up to 5)</span></Label>
            <div className="mt-1.5">
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadedImages.map(url => (
                    <div key={url} className="relative w-20 h-20 rounded-sm overflow-hidden bg-card border border-border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadedImages.length < 5 && (
                <label className={cn(
                  'flex items-center gap-3 px-4 py-3 border border-dashed border-border rounded-sm cursor-pointer hover:border-muted-foreground transition-colors text-sm text-muted-foreground',
                  uploading && 'opacity-50 cursor-not-allowed'
                )}>
                  <Upload size={16} />
                  {uploading ? 'Uploading…' : 'Upload references (JPG, PNG, WEBP)'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Cover-up */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="is_cover_up"
                checked={isCoverUp}
                onCheckedChange={v => setValue('is_cover_up', Boolean(v))}
              />
              <Label htmlFor="is_cover_up" className="cursor-pointer">This is a cover-up or rework of existing ink</Label>
            </div>
            {isCoverUp && (
              <div>
                <Label htmlFor="cover_up_notes">Describe the existing tattoo</Label>
                <Textarea
                  id="cover_up_notes"
                  {...register('cover_up_notes')}
                  className="mt-1.5"
                  placeholder="Size, age, colours, darkness — a photo reference helps enormously."
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Placement & Size */}
      <section>
        <SectionHeader title="Placement & Size" subtitle="Placement and size are the biggest factors in estimating session length." />
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="body_part">Body area *</Label>
              <select
                id="body_part"
                {...register('body_part')}
                className="mt-1.5 w-full h-10 rounded-md border border-input bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select body area</option>
                {BODY_PARTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <FieldError message={errors.body_part?.message} />
            </div>
            <div>
              <Label htmlFor="placement_detail">Specific placement</Label>
              <Input id="placement_detail" {...register('placement_detail')} className="mt-1.5" placeholder="e.g. outer left forearm" />
            </div>
          </div>

          <div>
            <Label>Approximate size *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {SIZE_CATEGORIES.map(({ value, label }) => (
                <label key={value} className="relative cursor-pointer">
                  <input type="radio" value={value} {...register('size_category')} className="peer sr-only" />
                  <div className="px-3 py-2.5 rounded-sm border border-border text-sm text-muted-foreground peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-muted-foreground transition-colors">
                    {label}
                  </div>
                </label>
              ))}
            </div>
            <FieldError message={errors.size_category?.message} />
          </div>

          <div>
            <Label htmlFor="size_notes">Size notes</Label>
            <Input id="size_notes" {...register('size_notes')} className="mt-1.5" placeholder="Any specifics about the size or shape" />
          </div>
        </div>
      </section>

      {/* Session */}
      <section>
        <SectionHeader title="Session Preferences" subtitle="Optional details to help with scheduling." />
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Checkbox
              id="is_first_tattoo"
              onCheckedChange={v => setValue('is_first_tattoo', Boolean(v))}
            />
            <Label htmlFor="is_first_tattoo" className="cursor-pointer">This will be my first tattoo</Label>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="preferred_date">Preferred date</Label>
              <Input
                id="preferred_date"
                type="date"
                {...register('preferred_date')}
                className="mt-1.5"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground mt-1">Jordan will confirm availability.</p>
            </div>
            <div>
              <Label>Time of day preference</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {TIME_PREFERENCES.map(t => (
                  <label key={t} className="relative cursor-pointer">
                    <input type="radio" value={t} {...register('time_preference')} className="peer sr-only" />
                    <div className="px-3 py-2 rounded-sm border border-border text-sm text-muted-foreground text-center peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-muted-foreground transition-colors">
                      {t}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Budget range</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {BUDGET_RANGES.map(b => (
                <label key={b} className="relative cursor-pointer">
                  <input type="radio" value={b} {...register('budget_range')} className="peer sr-only" />
                  <div className="px-3 py-2.5 rounded-sm border border-border text-sm text-muted-foreground peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 hover:border-muted-foreground transition-colors">
                    {b}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Anything else */}
      <section>
        <SectionHeader title="Anything Else?" />
        <Textarea
          {...register('additional_notes')}
          className="min-h-[100px]"
          placeholder="Any other context, questions, or things Jordan should know before getting in touch."
        />
      </section>

      {/* Consent + Submit */}
      <section className="border-t border-border pt-8 space-y-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            onCheckedChange={v => setValue('consent', Boolean(v))}
          />
          <Label htmlFor="consent" className="cursor-pointer text-sm text-muted-foreground leading-relaxed">
            I understand this is a <span className="text-foreground font-medium">booking request</span>, not a confirmed appointment. Jordan will be in touch within 48 hours to discuss availability and pricing.
          </Label>
        </div>
        <FieldError message={errors.consent?.message} />

        <Button
          type="submit"
          disabled={isSubmitting || uploading}
          className="w-full sm:w-auto px-10 py-6 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 text-base"
        >
          {isSubmitting ? 'Sending…' : 'Send Booking Request'}
        </Button>
      </section>
    </form>
  )
}
