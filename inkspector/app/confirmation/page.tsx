import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import Nav from '@/components/nav'
import { InstagramIcon } from '@/components/icons'

export default function ConfirmationPage() {
  return (
    <>
      <Nav />

      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg">
          <CheckCircle size={48} className="text-primary mx-auto mb-6" />
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">Request Received</h1>
          <p className="text-muted-foreground leading-relaxed mb-2">
            Thanks for reaching out! I&apos;ve received your booking request and will be in touch within <span className="text-foreground font-medium">48 hours</span> to discuss your design, confirm availability, and give you a quote.
          </p>
          <p className="text-sm text-muted-foreground mb-10">
            Keep an eye on your inbox — check your spam folder if you don&apos;t hear from me.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 border border-border text-sm rounded-sm hover:border-muted-foreground transition-colors"
            >
              Back to Home
            </Link>
            <a
              href="https://instagram.com/inkspector_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
            >
              <InstagramIcon size={15} /> Follow @inkspector_
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
