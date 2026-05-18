
import React from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import WhyChooseUs from '@/components/WhyChooseUs';
import TeamMembers from '@/components/TeamMembers';
import TutoringApproach from '@/components/TutoringApproach';
import FAQ from '@/components/FAQ';
import Testimonials from '@/components/Testimonials';

import Footer from '@/components/Footer';
import CTAWithContactInfo from '@/components/CTAWithContactInfo';
import ReviewCTA from '@/components/ReviewCTA';
import SEO from '@/components/SEO';

const Index = () => {
  React.useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.replace('#', '');
        const el = document.querySelector(`.${targetId}-component, #${targetId}`) as HTMLElement | null;
        if (el) {
          const headerOffset = window.innerWidth >= 768 ? 120 : 100;
          const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    };
    const t = setTimeout(scrollToHash, 150);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="EZ Tuition - Educators with a heart for excellence"
        description="Expert tutoring in maths, English, and science for students aged 0 to 18. Book your free consultation today!"
        canonicalUrl="https://eztuition.com"
      />
      <Navigation />
      <Hero />
      <Services />
      <WhyChooseUs />
      <TeamMembers />
      <TutoringApproach />
      <Testimonials />
      <FAQ />
      <CTAWithContactInfo />
      <ReviewCTA />
      <Footer />
    </div>
  );
};

export default Index;
