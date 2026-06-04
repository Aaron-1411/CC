import { Link } from "react-router-dom";
import { clinicConfig } from "@/config/clinic";
import { Eyebrow, Card } from "@/components/ui";

export function About() {
  return (
    <div className="bg-paper">
      <div className="container max-w-2xl py-12 sm:py-16">
        <Eyebrow>About this tool</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl">What the Compass is — and isn't</h1>

        <div className="mt-8 space-y-6 text-[0.97rem] leading-relaxed text-foreground/90">
          <p>
            {clinicConfig.name}'s Compass is an <strong>educational guide</strong>. It helps you put what you're
            experiencing into plain words, prepares a clear summary to share with a practitioner, and explains how
            different medical traditions understand health. That's all it does — and that's on purpose.
          </p>

          <Card className="p-5">
            <h2 className="font-serif text-xl">It does not</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>diagnose, screen for, or predict any condition;</li>
              <li>recommend a remedy, herb, supplement, medicine or dosage;</li>
              <li>claim that any treatment or tradition works, or rank one above another;</li>
              <li>replace professional medical advice or a consultation with a qualified practitioner.</li>
            </ul>
          </Card>

          <p>
            Because of this, it is <strong>not a medical device</strong>. Every path through the Compass ends the same
            way: with a qualified, registered human who makes the actual decisions with you.
          </p>

          <h2 className="font-serif text-2xl">The three traditions</h2>
          <p>
            We present conventional (Western) medicine, Traditional Chinese Medicine and Ayurveda as different{" "}
            <em>lenses</em> — distinct ways of understanding the body. We describe how each tradition <em>thinks</em>,
            not what to take. They're shown as equals, with respect, and never as competing or ranked truths.
          </p>

          <h2 className="font-serif text-2xl">Your information</h2>
          <p>
            We collect as little as possible, and what you type stays in your browser unless you choose to send it. See{" "}
            <Link to="/privacy" className="font-medium text-primary hover:underline">
              Privacy &amp; your data
            </Link>{" "}
            for the detail.
          </p>

          <p className="rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
            If your symptoms are severe, worsening, or an emergency, contact your GP, call NHS 111, or in an emergency
            call 999.
          </p>
        </div>
      </div>
    </div>
  );
}
