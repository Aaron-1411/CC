import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowRight, Phone, Mail, MapPin, Clock } from 'lucide-react';

const CTAWithContactInfo = () => {
  const navigate = useNavigate();

  const handleBookConsultation = () => {
    navigate('/contact');
    window.scrollTo(0, 0);
  };

  return (
    <section className="py-16 bg-background text-foreground">
      <div className="container mx-auto px-4">
        {/* CTA Content */}
        <div className="text-center mb-12">
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

        {/* Contact Info Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Call us directly</p>
                <a href="tel:07598027273" className="font-medium hover:text-primary transition-colors">
                  07598 027273
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Send us an email</p>
                <a href="mailto:Support@eztuition.co.uk" className="font-medium hover:text-primary transition-colors">
                  Support@eztuition.co.uk
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">We serve</p>
                <p className="font-medium">North London, Hertfordshire and surrounding areas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">We typically respond within</p>
                <p className="font-medium">24 hours</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTAWithContactInfo;