import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, Heart, Star } from 'lucide-react';

const WhyChooseUs = () => {
  return (
    <div className="why-choose-us-component py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Why Choose Us?</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We're committed to providing high-quality, accessible education that helps your child thrive.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-5">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Adaptive Teaching</h3>
                <p className="text-gray-600">
                  We regularly assess progress, ensuring every student receives the right level of support and challenge.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-5">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Flexible Scheduling</h3>
                <p className="text-gray-600">
                  Choose from weekday evenings, weekends, and school holidays to fit around your family commitments.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-5">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <Heart className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mastery-Based Learning</h3>
                <p className="text-gray-600">
                  Our tutoring approach ensures full understanding of each topic before progressing, fostering deeper learning and stronger academic results.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md bg-white hover:shadow-lg transition-shadow">
            <CardContent className="pt-5">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Results-Driven Practice</h3>
                <p className="text-gray-600">
                  We prioritise evidence-based teaching, using assessment results and progress to continually enhance our practice.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            "At EZ Tuition, we believe every child deserves education that's as unique as they are. Our qualified tutors don't just teach subjects—they inspire a love of learning."
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUs;
