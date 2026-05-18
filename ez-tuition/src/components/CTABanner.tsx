
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CTABanner = () => {
  const navigate = useNavigate();
  
  const goToContact = () => {
    navigate('/contact');
    window.scrollTo(0, 0);
  };
  return (
    <header className="w-full bg-accent text-accent-foreground py-1" role="banner">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-center bg-white/20 p-1 rounded-full mr-3">
            <BookOpen className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
          </div>
          <span className="font-heading text-sm font-medium">EZ Tuition: Need help with your child's education?</span>
        </div>
        <Button size="sm" variant="secondary" className="text-xs font-bold hover:bg-white/30" onClick={goToContact} aria-label="Contact us now - go to Get in Touch">
          <Phone className="h-3 w-3 mr-1" aria-hidden="true" />
          Contact Us Now
        </Button>
      </div>
    </header>
  );
};

export default CTABanner;
