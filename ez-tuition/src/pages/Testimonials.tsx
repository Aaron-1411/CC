
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';

const TestimonialsPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/#testimonials');
  }, [navigate]);
  
  return (
    <SEO 
      title="EZ Tuition Testimonials - Success Stories"
      description="Read what our students and parents say about EZ Tuition's effective tutoring methods and how we've helped improve academic performance."
      canonicalUrl="https://eztuition.com/testimonials"
    />
  );
};

export default TestimonialsPage;
