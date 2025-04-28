// src/components/Sections/Contact.js
import React from "react";
import { Dialog, DialogContent, DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
import ContactForm from "./ContactForm";

const Contact = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-8 bg-white rounded-lg shadow-lg animate-fadeIn z-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center">Contact Us</h2>
          <p className="text-center text-sm text-gray-600">
            We would love to hear from you!
          </p>
        </div>
        <ContactForm />
        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-2 right-2" aria-label="Close">
            &times;
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default Contact;
