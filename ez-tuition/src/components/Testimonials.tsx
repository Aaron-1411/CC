import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StarIcon } from 'lucide-react';

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex mb-2">
      {[...Array(5)].map((_, i) => (
        <StarIcon
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const TestimonialCard = ({ 
  content, 
  author, 
  role, 
  rating 
}: { 
  content: string; 
  author: string; 
  role: string;
  rating: number;
}) => (
  <Card className="h-full transition-all hover:shadow-lg border-none">
    <CardContent className="p-5">
      <StarRating rating={rating} />
      <p className="italic text-gray-700 mb-3">{content}</p>
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-bold">
          {author.charAt(0)}
        </div>
        <div className="ml-3">
          <h4 className="font-medium">{author}</h4>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Testimonials = () => {
  const testimonials = [
    {
      content: "My daughter was struggling with Maths, but after just two months with EZ Tuition, her confidence has soared and she's now getting top marks in class!",
      author: "Sarah J.",
      role: "Parent of Year 5 student",
      rating: 5
    },
    {
      content: "The SEND support has been invaluable for my son. His tutor understands his dyslexia and has developed strategies that have transformed his experience with English.",
      author: "Michael T.",
      role: "Parent of Year 8 student",
      rating: 5
    },
    {
      content: "The online sessions are so convenient for our busy schedule, and the quality of teaching is excellent. The interactive platform keeps my son engaged throughout.",
      author: "Emma D.",
      role: "Parent of Year 11 student",
      rating: 5
    }
  ];

  return (
    <div className="testimonials-component py-10 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">What Parents Say</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it – here's what families have to say about their experience with EZ Tuition.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              content={testimonial.content}
              author={testimonial.author}
              role={testimonial.role}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
