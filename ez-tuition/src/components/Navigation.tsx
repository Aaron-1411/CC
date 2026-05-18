import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const mobileOffset = 80; // Positive value to scroll less (show content from top)
  const desktopOffset = 100; // Keep desktop the same
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (componentName: string) => {
    setIsMenuOpen(false);

    if (componentName === 'contact') {
      navigate('/contact');
      window.scrollTo(0, 0);
      return;
    }

    const selector = `.${componentName}-component, #${componentName}`;
    const components = document.querySelectorAll(selector);

    if (components.length > 0) {
      const component = components[0] as HTMLElement;
      const headerOffset = isMobile ? mobileOffset : desktopOffset;

      setTimeout(() => {
        const elementTop = component.getBoundingClientRect().top;
        const offsetPosition = elementTop + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        console.log(`Scrolling to ${componentName} locally with offset: ${headerOffset}px`);
      }, 100);
    } else if (window.location.pathname !== '/') {
      window.location.href = `/#${componentName}`;
    } else {
      // If on home but element not found, still navigate as fallback
      window.location.href = `/#${componentName}`;
    }
  };

  return (
    <header className="w-full bg-gray-100 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-1 h-[70.4px] flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <div className="h-[80px] w-auto flex items-center justify-center">
            <img 
              src="/lovable-uploads/6d9042ed-2c04-492b-bb5c-87a0da2d885c.png" 
              alt="EZ Tuition Logo" 
              className="h-full w-auto object-contain"
              style={{ 
                maxHeight: "100%",
                width: "auto"
              }}
            />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          <button onClick={() => handleNavClick('hero')} className="text-lg text-gray-800 hover:text-primary transition-colors">
            Home
          </button>
          <button onClick={() => handleNavClick('why-choose-us')} className="text-lg text-gray-800 hover:text-primary transition-colors">
            About Us
          </button>
          <button onClick={() => handleNavClick('services')} className="text-lg text-gray-800 hover:text-primary transition-colors">
            Services
          </button>
          <button onClick={() => handleNavClick('testimonials')} className="text-lg text-gray-800 hover:text-primary transition-colors">
            Testimonials
          </button>
          <button onClick={() => handleNavClick('faq')} className="text-lg text-gray-800 hover:text-primary transition-colors">
            FAQ
          </button>
          <button onClick={() => handleNavClick('contact')} className="text-lg text-gray-800 hover:text-primary transition-colors">
            Contact
          </button>
        </nav>

        <div className="hidden md:block">
          <Button size="default" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base py-3 px-5 h-12" onClick={() => handleNavClick('contact')} aria-label="Book Free Consultation - go to Get in Touch">
            Book Free Consultation
          </Button>
        </div>

        <button className="md:hidden text-gray-800" onClick={toggleMenu}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-gray-100 border-t border-gray-200">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-3">
            <button onClick={() => handleNavClick('hero')} className="text-left text-lg text-gray-800 hover:text-primary transition-colors py-1.5">
              Home
            </button>
            <button onClick={() => handleNavClick('why-choose-us')} className="text-left text-lg text-gray-800 hover:text-primary transition-colors py-1.5">
              About Us
            </button>
            <button onClick={() => handleNavClick('services')} className="text-left text-lg text-gray-800 hover:text-primary transition-colors py-1.5">
              Services
            </button>
            <button onClick={() => handleNavClick('testimonials')} className="text-left text-lg text-gray-800 hover:text-primary transition-colors py-1.5">
              Testimonials
            </button>
            <button onClick={() => handleNavClick('faq')} className="text-left text-lg text-gray-800 hover:text-primary transition-colors py-1.5">
              FAQ
            </button>
            <button onClick={() => handleNavClick('contact')} className="text-left text-lg text-gray-800 hover:text-primary transition-colors py-1.5">
              Contact
            </button>
            <Button size="default" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full font-bold py-3 text-base h-12" onClick={() => handleNavClick('contact')} aria-label="Book Free Consultation - go to Get in Touch">
              Book Free Consultation
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navigation;
