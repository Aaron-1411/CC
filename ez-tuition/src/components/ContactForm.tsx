import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';

const serviceOptions = {
  "online-individual": "1-on-1 Online",
  "inperson-individual": "1-on-1 In-Person",
  "online-group": "Group Online",
  "inperson-group": "Group In-Person",
  "independent-learning-hub": "Independent Learning Hub"
};

const ContactForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subject, setSubject] = React.useState('');
  const [selectedService, setSelectedService] = React.useState('');
  const [yearOfStudy, setYearOfStudy] = React.useState('');

  useEffect(() => {
    const service = sessionStorage.getItem('selectedService');
    if (service) {
      setSelectedService(service);
      sessionStorage.removeItem('selectedService');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🚀 FORM SUBMIT TRIGGERED');
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Validate required fields
    const name = formData.get('parentName') as string;
    const email = formData.get('email') as string;
    
    if (!name || !email || !yearOfStudy || !selectedService || !subject) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }
    
    // Create enquiry object for localStorage
    const enquiry = {
      id: Date.now().toString(),
      name: name,
      email: email,
      phone: formData.get('phone') as string || '',
      yearOfStudy: yearOfStudy,
      service: selectedService,
      subject: subject,
      message: formData.get('message') as string || '',
      timestamp: new Date().toISOString()
    };
    
    try {
      // Get existing enquiries from localStorage
      const existing = localStorage.getItem('contactEnquiries');
      const enquiries = existing ? JSON.parse(existing) : [];
      
      // Add new enquiry
      enquiries.unshift(enquiry);
      
      // Save back to localStorage
      localStorage.setItem('contactEnquiries', JSON.stringify(enquiries));
      
      toast({
        title: "Enquiry Received!",
        description: "Thank you for your interest. We'll be in touch within 24 hours.",
        duration: 5000,
      });
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      setSubject('');
      setSelectedService('');
      setYearOfStudy('');
      
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "There was an issue sending your enquiry. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="contact" className="contact-component py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-gray-600">
              Have questions or ready to start? Fill in the form below and we'll get back to you within 24 hours.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="parentName" className="text-sm font-medium">
                    Your Name *
                  </label>
                  <Input 
                    id="parentName"
                    name="parentName" 
                    placeholder="Enter your full name" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </label>
                  <Input 
                    id="email"
                    name="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input 
                    id="phone"
                    name="phone" 
                    type="tel" 
                    placeholder="Your contact number" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="yearOfStudy" className="text-sm font-medium">
                    Year of Study *
                  </label>
                  <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year of study" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a-level">A-Level (Yr 12-13)</SelectItem>
                      <SelectItem value="gcse">GCSE (Yr 10-11)</SelectItem>
                      <SelectItem value="ks3">KS3 (Yr 7-9)</SelectItem>
                      <SelectItem value="ks2">KS2 (Yr 3-6)</SelectItem>
                      <SelectItem value="ks1">KS1 (Yr 1-2)</SelectItem>
                      <SelectItem value="eyfs">EYFS (Early Years Foundation Stage)</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="yearOfStudy" value={yearOfStudy} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="service" className="text-sm font-medium">
                  Service of Interest *
                </label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online-individual">1-on-1 Online</SelectItem>
                    <SelectItem value="inperson-individual">1-on-1 In-Person</SelectItem>
                    <SelectItem value="online-group">Group Online</SelectItem>
                    <SelectItem value="inperson-group">Group In-Person</SelectItem>
                    <SelectItem value="independent-learning-hub">Independent Learning Hub</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="selectedService" value={selectedService} />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject(s) of Interest *
                </label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maths">Maths</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="multiple">Multiple Subjects</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="subject" value={subject} />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Additional Information
                </label>
                <Textarea 
                  id="message"
                  name="message" 
                  placeholder="Tell us about your child's needs, any areas they're struggling with, or questions you have." 
                  rows={4} 
                />
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm text-gray-600">
                  We value your privacy. Your information will only be used to respond to your enquiry and will never be shared with third parties.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Request a Call Back"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
