import PageHeader from "@/components/PageHeader";

export default function Privacy() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="What we collect, why we collect it, and the controls you have."
        documentTitle="Privacy Policy"
      />
      <div className="max-w-3xl mx-auto px-6 py-10 prose prose-slate">
        <p className="text-sm text-muted-foreground">Last updated: 5 May 2026</p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">Who we are</h2>
        <p>
          The First-Time Buyer Toolkit (“we”, “us”) is an online toolkit that helps people in the
          UK plan, search and decide on their first home. We are the data controller for any
          personal information you give us through this site.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">What we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account data</strong> – your email address and an encrypted password (or your Google sign-in ID).</li>
          <li><strong>Tool inputs</strong> – the numbers you type (price, deposit, income), saved scenarios, shortlisted properties and area selections.</li>
          <li><strong>Technical data</strong> – browser type, IP address, pages visited and timestamps, used to keep the service secure and improve it.</li>
        </ul>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">How we use it</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To run your account, save your scenarios and sync your shortlist across devices.</li>
          <li>To produce the calculations, comparisons and reports you request.</li>
          <li>To keep the service secure, debug errors and prevent abuse.</li>
          <li>To send essential service emails (e.g. password resets, account changes).</li>
        </ul>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">Lawful basis</h2>
        <p>
          We process your data on the basis of <strong>contract</strong> (to deliver the service you
          asked for), <strong>legitimate interest</strong> (to keep the service safe and reliable),
          and <strong>consent</strong> (for any non-essential cookies or marketing).
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">Sharing</h2>
        <p>
          We use trusted infrastructure providers (hosting, database, authentication, email) who
          process data on our behalf under data-processing agreements. We do not sell your
          personal data.
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">Your rights</h2>
        <p>
          Under UK GDPR you can ask us to access, correct, export or delete your data, or to
          restrict its use. Contact <a href="/contact" className="text-brand underline">us</a> and
          we will respond within 30 days. You can also complain to the Information Commissioner
          (ico.org.uk).
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">Retention</h2>
        <p>
          We keep your account data for as long as you have an account. Delete your account at any
          time and we will remove your saved scenarios, shortlists and profile within 30 days
          (backups are purged on a 90-day rolling cycle).
        </p>

        <h2 className="font-serif text-2xl font-bold text-brand mt-8">Cookies</h2>
        <p>
          We use a small number of strictly-necessary cookies to keep you signed in and remember
          your preferences. We do not use advertising or cross-site tracking cookies.
        </p>
      </div>
    </>
  );
}
