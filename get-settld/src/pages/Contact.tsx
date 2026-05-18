import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Mail, LifeBuoy, Bug, Shield } from "lucide-react";

const SUPPORT_EMAIL = "support@ftb-toolkit.co.uk";

const links = [
  { icon: LifeBuoy, label: "Help & general questions", to: `mailto:${SUPPORT_EMAIL}?subject=Help` },
  { icon: Bug, label: "Report a bug or wrong number", to: `mailto:${SUPPORT_EMAIL}?subject=Bug%20report` },
  { icon: Shield, label: "Privacy or data request", to: `mailto:${SUPPORT_EMAIL}?subject=Privacy%20request` },
];

export default function Contact() {
  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Contact us"
        description="Real humans read every email. We aim to reply within two working days."
        documentTitle="Contact us"
      />
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <Card className="p-6 flex items-center gap-4">
          <Mail className="w-8 h-8 text-brand" />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Email</div>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-lg font-semibold text-brand underline">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </Card>

        <div className="grid sm:grid-cols-3 gap-3">
          {links.map(({ icon: Icon, label, to }) => (
            <a key={label} href={to} className="block">
              <Card className="p-4 h-full hover:border-brand transition-colors">
                <Icon className="w-5 h-5 text-brand mb-2" />
                <div className="text-sm font-medium">{label}</div>
              </Card>
            </a>
          ))}
        </div>

        <div className="text-sm text-muted-foreground border-t pt-6">
          <p>
            Please include the page or tool you were using and a screenshot if you can — it helps
            us reproduce issues quickly.
          </p>
          <p className="mt-2">
            For data-protection enquiries see our{" "}
            <a href="/privacy" className="text-brand underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </>
  );
}
