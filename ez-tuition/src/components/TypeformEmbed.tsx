import React from 'react';

const TypeformEmbed = () => {
  return (
    <div id="contact" className="contact-component py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-2 shadow-sm border border-gray-100 overflow-hidden">
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
  );
};

export default TypeformEmbed;