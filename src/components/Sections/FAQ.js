// src/components/Sections/FAQ.js
import React from "react";
import { Button } from "../ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";

const FAQ = ({ onContactClick }) => {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          Frequently Asked Questions
        </h2>
        
        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto mb-12">
          <Accordion type="single" collapsible className="w-full space-y-4">
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
            {/* Add more FAQ items as needed */}
          </Accordion>
        </div>

        <Button
          onClick={onContactClick}
          className="px-6 py-3 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
        >
          Have a Question?
        </Button>
      </div>
    </section>
  );
};

export default FAQ;
