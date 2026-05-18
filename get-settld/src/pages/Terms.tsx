import PageHeader from "@/components/PageHeader";

export default function Terms() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        description="The rules for using this toolkit, in plain English."
        documentTitle="Terms of Use"
      />
      <div className="max-w-3xl mx-auto px-6 py-10 prose prose-slate">
        <p className="text-sm text-muted-foreground">Last updated: 5 May 2026</p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">1. The service</h2>
        <p>
          The First-Time Buyer Toolkit is an information and calculation tool for prospective UK
          home buyers. It does <strong>not</strong> provide regulated financial advice, legal advice,
          mortgage broking, or estate-agency services.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">2. Use the tool sensibly</h2>
        <p>
          Numbers and verdicts shown by the toolkit are estimates based on the inputs you provide
          and publicly-available data. You agree to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Treat results as a guide, not a recommendation.</li>
          <li>Verify any figure that affects a real-world decision with a qualified professional (mortgage broker, solicitor, surveyor).</li>
          <li>Not abuse the service or attempt to disrupt it.</li>
        </ul>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">3. Your account</h2>
        <p>
          You are responsible for keeping your sign-in credentials safe. Tell us straight away if
          you suspect unauthorised access.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">4. Intellectual property</h2>
        <p>
          The toolkit, brand, calculations, copy and design are owned by us and licensed to you for
          personal, non-commercial use. You keep ownership of anything you input.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">5. Liability</h2>
        <p>
          To the fullest extent permitted by law we are not liable for any loss arising from
          decisions you take based on toolkit output. Nothing in these terms limits liability for
          fraud, death or personal injury caused by negligence, or other liability that cannot be
          excluded by law.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">6. Changes</h2>
        <p>
          We may update these terms from time to time. We will surface material changes inside the
          app and in the changelog.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">7. Governing law</h2>
        <p>
          These terms are governed by the laws of England and Wales. Disputes are subject to the
          exclusive jurisdiction of the courts of England and Wales.
        </p>
      </div>
    </>
  );
}
