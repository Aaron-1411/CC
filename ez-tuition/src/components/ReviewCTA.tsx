import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink } from 'lucide-react';

const ReviewCTA = () => {
  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
          <h3 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            Love Our Service?
          </h3>
          <p className="text-muted-foreground mb-6">
            Your feedback helps other families discover quality tutoring. Share your experience with us!
          </p>
          <Button 
            asChild
            size="lg"
            className="font-semibold"
          >
            <a 
              href="https://www.bark.com/en/gb/b/ez-tuition-limited/MLNJnA/?review_source=share_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              Leave a Review
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReviewCTA;