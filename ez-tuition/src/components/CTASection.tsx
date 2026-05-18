import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();

  const handleBookConsultation = () => {
    navigate('/contact');
    window.scrollTo(0, 0);
  };

  return (
    <section className="py-16 bg-background text-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Child's Learning Journey?
          </h2>
          <p className="text-xl mb-8 text-muted-foreground">
            Book a free consultation today and discover how EZ Tuition can help your child excel in their studies.
          </p>
          <Button 
            onClick={handleBookConsultation}
            size="lg"
            variant="default"
            className="text-lg px-8 py-4 font-semibold group hover:scale-105 transition-all"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Your Free Consultation
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;