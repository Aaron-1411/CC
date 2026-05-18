
import React from 'react';
import { Trophy, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const TutoringApproach = () => {
  return (
    <div className="tutoring-approach-component bg-gradient-to-r from-blue-50 to-purple-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-4 mb-8">
            <Trophy className="h-12 w-12 text-accent" />
            <Star className="h-12 w-12 text-accent animate-pulse" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
            Personalised Learning Journey
          </h2>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                Our 1-1 sessions are meticulously tailored to each student's unique needs and goals. Each of our pupils will receive a comprehensive learning plan, tailored to their individual needs. This will include targeted homework and stimulating extension tasks. Every session will incorporate some form of formative assessment, enabling us to thoughtfully refine the intricate mosaic of learning we aim to build. This personalised approach ensures that pupils not only achieve, but surpass, their academic goals—while also nurturing a genuine love of learning.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TutoringApproach;
