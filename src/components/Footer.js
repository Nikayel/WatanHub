import React from 'react';
import { Mail, MapPin, Heart, } from 'lucide-react';


const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white pt-12 pb-6">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: About */}
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-semibold mb-4">Watan</h3>
            <p className="text-indigo-200 mb-4 max-w-md">
              Helping students navigate their educational journey with personalized mentorship 
              and support every step of the way.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-indigo-200 hover:text-white transition-colors">
                {/* <GitHub size={20} /> */}
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors">
                {/* <Linkedin size={20} /> */}
              </a>
              <a href="#" className="text-indigo-200 hover:text-white transition-colors">
                {/* <Instagram size={20} /> */}
              </a>
            </div>
          </div>

          {/* Column 2: Links */}
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-indigo-200 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#services" className="text-indigo-200 hover:text-white transition-colors">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-indigo-200 hover:text-white transition-colors">
                  Success Stories
                </a>
              </li>
              <li>
                <a href="#faq" className="text-indigo-200 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="text-indigo-200 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="mr-2 text-indigo-300 flex-shrink-0 mt-1" size={18} />
                <span className="text-indigo-200">
                  Sacramento, CA 95814
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 text-indigo-300 flex-shrink-0" size={18} />
                <a href="mailto:info@watan.org" className="text-indigo-200 hover:text-white transition-colors">
                  watan8681@gmail.com
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <a href="#newsletter" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors">
                Subscribe to Newsletter
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-indigo-700 my-6"></div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-indigo-300">
          <p>&copy; {currentYear} Watan. All rights reserved.</p>
          <div className="flex mt-4 md:mt-0 items-center">
            <span className="flex items-center">
              Made with <Heart size={14} className="mx-1 text-pink-400" /> for education
            </span>
            <span className="mx-3">|</span>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="mx-2">•</span>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;