import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How are our tutoring sessions structured?",
      answer: "Each session is personalised and includes a prior knowledge check, modelled examples of new material, a progress check to assess understanding, and extended learning tasks to support independent study."
    },
    {
      question: "What qualifications do your tutors have?",
      answer: "All our tutors are qualified professionals with at least 3 years of teaching experience. They hold relevant degrees and teaching qualifications, and many have specialised training in supporting children with SEND."
    },
    {
      question: "How do online sessions work?",
      answer: "Sessions are delivered securely via Microsoft Teams. Students just need a computer or tablet with internet access. We'll help you get set up before your first session."
    },
    {
      question: "Do you offer tutoring during school holidays?",
      answer: "Yes! We provide flexible scheduling including evenings, weekends, and school holidays. Many families find holiday tutoring helpful for maintaining momentum or additional preparation for upcoming exams."
    },
    {
      question: "Can I switch between online and in-person sessions?",
      answer: "Absolutely. Many families appreciate the flexibility of combining both options. You can adjust your preference based on your schedule, and we'll ensure continuity in your child's learning experience."
    }
  ];

  return (
    <div className="faq-component py-10 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our tutoring services.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-5">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium py-3">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
