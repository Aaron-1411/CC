import React from 'react';

const TypeformEmbedHome = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">Get Started Today</h2>
          </div>
          
          <div className="bg-card rounded-xl p-2 shadow-sm border border-border overflow-hidden">
            <iframe
              src="https://form.typeform.com/to/kW4iPuL2"
              style={{ width: '100%', height: '600px', border: 'none' }}
              title="Book Consultation Form"
              allow="camera; microphone; autoplay; encrypted-media; fullscreen"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TypeformEmbedHome;