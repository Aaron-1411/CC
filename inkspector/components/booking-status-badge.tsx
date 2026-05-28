import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/types/booking'
import { cn } from '@/lib/utils'

const config: Record<BookingStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmed', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  completed: { label: 'Completed', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  waitlist:  { label: 'Waitlist',  className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
}

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = config[status] ?? config.pending
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', className)}>
      {label}
    </Badge>
  )
}
