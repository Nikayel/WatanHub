import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';

const FAQ = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 max-w-7xl perspective" style={{ perspective: '1000px' }}>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="q1">
            <AccordionTrigger className="transition-transform duration-300 transform hover:rotate-3 hover:scale-105">
              How do I find a mentor?
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-white rounded-md shadow-sm">
              Click the "Contact" button to get started, and we'll match you with a mentor based on your interests.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger className="transition-transform duration-300 transform hover:rotate-3 hover:scale-105">
              Is mentorship free?
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-white rounded-md shadow-sm">
              Yes! Our mentorship program is completely free for students.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
