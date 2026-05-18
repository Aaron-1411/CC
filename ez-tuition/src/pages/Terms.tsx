
import React from 'react';
import CTABanner from '@/components/CTABanner';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Terms & Conditions - EZ Tuition"
        description="Read EZ Tuition's terms and conditions regarding our tutoring services, payment policies, and user agreements."
        canonicalUrl="https://eztuition.com/terms"
      />
      <CTABanner />
      <Navigation />
      <div className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using EZ Tuition's services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Services Description</h2>
            <p className="text-gray-700">
              EZ Tuition provides educational tutoring services. We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Payment Terms</h2>
            <p className="text-gray-700">
              Payment is required before the commencement of tutoring sessions. All fees are non-refundable unless otherwise specified. We reserve the right to modify our pricing with appropriate notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Cancellation Policy</h2>
            <p className="text-gray-700">
              24 hours notice is required for cancellation of any tutoring session. Late cancellations or no-shows may be charged at the full session rate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Code of Conduct</h2>
            <p className="text-gray-700">
              Students and tutors are expected to maintain professional behavior during all interactions. Any form of harassment or inappropriate behavior will not be tolerated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700">
              EZ Tuition is not liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: April 16, 2025
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
