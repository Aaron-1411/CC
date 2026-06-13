import { clinicConfig } from "@/config/clinic";
import { Eyebrow } from "@/components/ui";

export function Privacy() {
  return (
    <div className="bg-paper">
      <div className="container max-w-2xl py-12 sm:py-16">
        <Eyebrow>Privacy &amp; your data</Eyebrow>
        <h1 className="mt-2 font-serif text-4xl">Your information, handled lightly</h1>

        <div className="mt-8 space-y-6 text-[0.97rem] leading-relaxed text-foreground/90">
          <p>
            Health information is sensitive, and UK data protection law (UK GDPR and the Data Protection Act 2018)
            treats it that way. So do we. Our approach is simple: collect the minimum, keep the footprint small, and be
            clear about it.
          </p>

          <div>
            <h2 className="font-serif text-2xl">What you type into the Compass</h2>
            <p className="mt-2 text-muted-foreground">
              The answers you give while using the Compass stay <strong>in your own browser</strong>. They're used only
              to generate your summary and the educational view on screen. Nothing you type is sent to {clinicConfig.name}{" "}
              or anyone else unless you deliberately choose to — by submitting the contact form and ticking the box to
              share your summary.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">If you contact the clinic</h2>
            <p className="mt-2 text-muted-foreground">
              When you submit the contact form, the details you enter — your name, email, any phone number or message,
              and (only if you tick the box) the health summary you prepared — are sent to {clinicConfig.name} and stored
              in its systems so it can respond to you. Depending on how the clinic is set up, that means a secure database
              and/or an email notification to the clinic. We use these details for that one purpose: we don't sell your
              data, and we don't share it elsewhere.
            </p>
            <p className="mt-2 text-muted-foreground">
              <strong>{clinicConfig.name}</strong> is the data controller for the information you send through this form,
              and is responsible for how it's handled. The consent you give — including the version you agreed to — is
              recorded alongside your enquiry.
            </p>
            <p className="mt-2 text-muted-foreground">
              Your details are kept only as long as needed to respond to you and to meet the clinic's own record-keeping
              obligations, then deleted. For the clinic's specific retention period, or to ask for a copy of your data or
              to have it corrected or removed, contact{" "}
              {clinicConfig.contactEmail ? (
                <a href={`mailto:${clinicConfig.contactEmail}`} className="font-medium text-primary hover:underline">
                  {clinicConfig.contactEmail}
                </a>
              ) : (
                <span>the clinic directly</span>
              )}
              .
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">No tracking for advertising</h2>
            <p className="mt-2 text-muted-foreground">
              This tool isn't built to profile you or follow you around the web. You can clear what's stored at any time
              by clearing your browser's site data.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl">Questions</h2>
            <p className="mt-2 text-muted-foreground">
              For anything about your data, contact{" "}
              {clinicConfig.contactEmail ? (
                <a href={`mailto:${clinicConfig.contactEmail}`} className="font-medium text-primary hover:underline">
                  {clinicConfig.contactEmail}
                </a>
              ) : (
                <span>the clinic directly</span>
              )}
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
