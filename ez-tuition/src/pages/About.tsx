
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';

const About = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/#why-choose-us');
  }, [navigate]);
  
  return (
    <SEO 
      title="About EZ Tuition - Our Learning Philosophy"
      description="Learn about EZ Tuition's approach to education, our qualified tutors, and how we help students achieve academic success."
      canonicalUrl="https://eztuition.com/about"
    />
  );
};

export default About;
