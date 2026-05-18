import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ReviewCTA from '@/components/ReviewCTA';

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Contact Us - EZ Tuition"
        description="Get in touch with EZ Tuition for expert tutoring in maths, English, and science. Book your free consultation today!"
        canonicalUrl="https://eztuition.com/contact"
      />
      <Navigation />
      
      <main className="flex-grow">
        <div className="contact-component py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">Get in Touch</h1>
              </div>
              
              <div className="bg-card rounded-xl p-2 shadow-sm border border-border overflow-hidden">
                <iframe
                  src="https://form.typeform.com/to/kW4iPuL2"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title="Contact Form"
                  allow="camera; microphone; autoplay; encrypted-media; fullscreen"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <ReviewCTA />
      <Footer />
    </div>
  );
};

export default Contact;