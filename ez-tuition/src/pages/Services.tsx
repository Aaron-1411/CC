
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';

const Services = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/#services');
  }, [navigate]);
  
  return (
    <SEO 
      title="EZ Tuition Services - Personalized Academic Support"
      description="Explore EZ Tuition's comprehensive tutoring services including one-on-one sessions, group classes, and specialized subject tutoring."
      canonicalUrl="https://eztuition.com/services"
    />
  );
};

export default Services;
