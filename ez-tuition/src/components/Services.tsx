import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Video, Users, Home, BookOpen, Brain, FileEdit, Globe } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const ServiceCard = ({ 
  icon, 
  title, 
  description, 
  price, 
  isOnline,
  serviceId
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  price: string;
  isOnline: boolean;
  serviceId: string;
}) => {
  const navigate = useNavigate();
  
  const handleServiceClick = () => {
    sessionStorage.setItem('selectedService', serviceId);
    navigate('/contact');
    window.scrollTo(0, 0);
  };

  return (
    <Card 
      className="h-full transition-all hover:shadow-lg cursor-pointer hover:border-primary"
      onClick={handleServiceClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            {isOnline ? 'Online' : 'In-Person'}
          </span>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-2">
          <span className="text-2xl font-bold text-primary">{price}</span>
          <span className="text-gray-500 text-sm ml-1">/hour</span>
        </div>
      </CardContent>
    </Card>
  );
};

const Services = () => {
  const navigate = useNavigate();
  return (
    <div className="services-component py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Our Tutoring Services</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We offer flexible tutoring options in Maths, English, and Science for primary and secondary students, delivered by experienced educators.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ServiceCard
            icon={<Video className="h-5 w-5 text-primary" />}
            title="1-on-1 Online"
            description="Personalised online tutoring from the comfort of your home."
            price="from £25"
            isOnline={true}
            serviceId="online-individual"
          />
          
          <ServiceCard
            icon={<Home className="h-5 w-5 text-primary" />}
            title="1-on-1 In-Person"
            description="Face-to-face tutoring at your home or a convenient location."
            price="from £45"
            isOnline={false}
            serviceId="inperson-individual"
          />
          
          <ServiceCard
            icon={<Users className="h-5 w-5 text-primary" />}
            title="Group Online"
            description="Small group sessions of up to 6 students for collaborative learning."
            price="from £18"
            isOnline={true}
            serviceId="online-group"
          />
          
          <ServiceCard
            icon={<Users className="h-5 w-5 text-primary" />}
            title="Group In-Person"
            description="Highly adaptive in-person group sessions with 2-4 students."
            price="from £30"
            isOnline={false}
            serviceId="inperson-group"
          />
        </div>
        
        <div className="mt-10">
          <Card 
            className="border-accent/30 bg-accent/5 cursor-pointer hover:border-accent"
            onClick={() => {
              sessionStorage.setItem('selectedService', 'independent-learning-hub');
              navigate('/contact');
              window.scrollTo(0, 0);
            }}
          >
            <CardContent className="pt-4">
              <div className="flex flex-col items-start gap-4 p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-0">
                    <BookOpen className="h-8 w-8 text-accent" />
                    <span className="px-3 py-1 bg-accent/20 text-accent font-medium rounded-full text-sm">
                      Online Only
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-1 mt-1">Independent Learning Hub</h3>
                  <p className="text-gray-600 mb-2">
                    A dedicated support service designed to empower students in developing the skills and strategies they need to take control of their own learning journey.
                  </p>
                  <p className="text-gray-600 font-bold mb-3">
                    We offer tailored guidance and consultancy in key areas such as:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-3">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-8 w-8 text-accent" />
                        <h4 className="font-bold text-primary">Effective Revision Techniques</h4>
                      </div>
                      <p className="text-sm text-gray-600">Learn how to revise smarter, not harder, with proven methods suited to individual learning styles.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <FileEdit className="h-8 w-8 text-accent" />
                        <h4 className="font-bold text-primary">Homework & Coursework Consultancy</h4>
                      </div>
                      <p className="text-sm text-gray-600">Get expert advice on planning, structuring, and completing assignments with confidence and clarity.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-8 w-8 text-accent" />
                        <h4 className="font-bold text-primary">Quality Resource Access</h4>
                      </div>
                      <p className="text-sm text-gray-600">Access curated tools, websites, and materials that support independent study across a range of subjects.</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-accent">from £60</span>
                    <span className="text-gray-500 text-sm ml-1">/month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Services;
