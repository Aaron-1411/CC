
import React from 'react';
import CTABanner from '@/components/CTABanner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Privacy Policy - EZ Tuition"
        description="Learn about EZ Tuition's privacy policy, how we protect your personal information and data privacy practices."
        canonicalUrl="https://eztuition.com/privacy"
      />
      <CTABanner />
      <Navigation />
      <div className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-gray-700">
              We collect information that you provide directly to us, including name, contact information, and academic details necessary for providing tutoring services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700">
              We use your information to:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 text-gray-700">
              <li>Provide and improve our tutoring services</li>
              <li>Communicate with you about our services</li>
              <li>Process your payments</li>
              <li>Send you important updates and announcements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="text-gray-700">
              We do not sell, trade, or otherwise transfer your personal information to outside parties. This does not include trusted third parties who assist us in operating our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
            <p className="text-gray-700">
              We use cookies to enhance your experience on our website. You can choose to disable cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-gray-700">
              You have the right to access, correct, or delete your personal information. Please contact us if you wish to exercise these rights.
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

export default Privacy;
