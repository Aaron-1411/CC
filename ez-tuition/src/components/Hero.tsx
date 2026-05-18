
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Star } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  const scrollToServices = () => {
    const servicesSection = document.querySelector('.services-component');
    if (servicesSection) {
      const headerHeight = window.innerWidth >= 768 ? 120 : 100;
      const componentPosition = servicesSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({
        top: componentPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToContact = () => {
    navigate('/contact');
    window.scrollTo(0, 0);
  };

  return (
    <div className="hero-component relative bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNDI4NTgiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiAwaDZ2LTZoLTZ2NnptLTYtNnY2aC02di02aDZ6bTYgMGg2di02aC02djZ6bS02LTZ2LTZoLTZ2Nmg2em0wIDBoNnYtNmgtNnY2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
      
      <div className="container mx-auto px-4 py-6 md:py-12 relative">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 leading-tight">
              Educators with a heart for <span className="text-primary">excellence</span> - <span className="font-heading text-gray-700">Colossians 3:23</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              Nurturing academic excellence in Maths, English, and Science for students aged 0 to 18
            </p>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <BookOpen className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Qualified Tutors</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Users className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">SEND Experience</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Adaptive Teaching</span>
              </div>
            </div>
            
            {/* Mobile-only video above CTA */}
            <div className="md:hidden w-full mb-4">
              <div className="relative">
                <iframe 
                  src="https://www.youtube.com/embed/_eVhMrcFjlM?autoplay=1&mute=1&loop=1&playlist=_eVhMrcFjlM"
                  className="w-full aspect-video rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="EZ Tuition Introduction Video (Mobile)"
                ></iframe>
              </div>
            </div>

            <div className="flex flex-wrap">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-xl py-8 px-10" onClick={scrollToContact}>
                Book a Free Consultation
              </Button>
            </div>
          </div>
          
          <div className="hidden md:block md:w-1/2 mt-8 md:mt-0">
            <div className="relative">
              
              
              <iframe 
                src="https://www.youtube.com/embed/_eVhMrcFjlM?autoplay=1&mute=1&loop=1&playlist=_eVhMrcFjlM"
                className="w-full aspect-video rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="EZ Tuition Introduction Video"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
