import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Heart, ChevronRight, ChevronDown, Github, Linkedin, Instagram } from 'lucide-react';

const Footer = ({onAboutClick}) => {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState(null);

  // Animate footer on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.body.offsetHeight;
      
      if (scrollPosition > pageHeight - 300) {
        setIsVisible(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Toggle mobile accordions
  const toggleColumn = (column) => {
    setExpandedColumn(expandedColumn === column ? null : column);
  };

  return (
    <footer className={`bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white pt-12 pb-6 relative overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-400 to-teal-400"></div>
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-pink-500 opacity-10 -translate-y-1/2"></div>
      <div className="absolute bottom-32 left-10 w-24 h-24 rounded-full bg-indigo-400 opacity-5"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-teal-400 opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: About */}
          <div className="mb-6 md:mb-0 transform transition-all duration-500 hover:translate-y-[-5px]">
            <div className="md:hidden flex justify-between items-center" onClick={() => toggleColumn('about')}>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-300">Watan</h3>
              {expandedColumn === 'about' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            <h3 className="hidden md:block text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-300">Watan</h3>
            
            <div className={`transition-all duration-300 overflow-hidden ${expandedColumn === 'about' || window.innerWidth >= 768 ? 'max-h-96' : 'max-h-0 md:max-h-96'}`}>
              <p className="text-indigo-200 mb-4 max-w-md leading-relaxed">
                Helping students navigate their educational journey with personalized mentorship 
                and support every step of the way.
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-indigo-200 hover:text-pink-400 transition-colors transform hover:scale-110">
                  <Github size={20} />
                </a>
                <a href="#" className="text-indigo-200 hover:text-pink-400 transition-colors transform hover:scale-110">
                  <Linkedin size={20} />
                </a>
                <a href="https://www.instagram.com/watan.youth.group" className="text-indigo-200 hover:text-pink-400 transition-colors transform hover:scale-110">
                  <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Links */}
          <div className="mb-6 md:mb-0 transform transition-all duration-500 hover:translate-y-[-5px]">
            <div className="md:hidden flex justify-between items-center" onClick={() => toggleColumn('links')}>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-teal-300">Quick Links</h3>
              {expandedColumn === 'links' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            <h3 className="hidden md:block text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-teal-300">Quick Links</h3>
            
            <div className={`transition-all duration-300 overflow-hidden ${expandedColumn === 'links' || window.innerWidth >= 768 ? 'max-h-96' : 'max-h-0 md:max-h-96'}`}>
            <div className={`transition-all duration-300 overflow-hidden ${expandedColumn === 'links' || window.innerWidth >= 768 ? 'max-h-96' : 'max-h-0 md:max-h-96'}`}>
            <ul className="space-y-2">
  {['About Us', 'Our Services', 'Success Stories', 'FAQ', 'Contact Us'].map((link, index) => {
    const isAboutUs = link === 'About Us';

    return (
      <li key={index} className="transform transition-all duration-300 hover:translate-x-2">
        {isAboutUs ? (
          <button
            onClick={onAboutClick}
            className="text-indigo-200 hover:text-white transition-colors flex items-center group"
          >
            <ChevronRight size={16} className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="group-hover:underline">{link}</span>
          </button>
        ) : (
          <a
            href={`#${link.toLowerCase().replace(/\s/g, '')}`} // TODO: Make sure your page has these ids if you want anchors
            className="text-indigo-200 hover:text-white transition-colors flex items-center group"
          >
            <ChevronRight size={16} className="mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="group-hover:underline">{link}</span>
          </a>
        )}
      </li>
    );
  })}
</ul>

</div>

</div>

          </div>

          {/* Column 3: Contact */}
          <div className="transform transition-all duration-500 hover:translate-y-[-5px]">
            <div className="md:hidden flex justify-between items-center" onClick={() => toggleColumn('contact')}>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-pink-400">Contact Us</h3>
              {expandedColumn === 'contact' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            <h3 className="hidden md:block text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-pink-400">Contact Us</h3>
            
            <div className={`transition-all duration-300 overflow-hidden ${expandedColumn === 'contact' || window.innerWidth >= 768 ? 'max-h-96' : 'max-h-0 md:max-h-96'}`}>
              <ul className="space-y-3">
                <li className="flex items-start hover:translate-x-1 transition-transform">
                  <MapPin className="mr-2 text-pink-400 flex-shrink-0 mt-1" size={18} />
                  <span className="text-indigo-200">
                    Sacramento, CA 95814
                  </span>
                </li>
                <li className="flex items-center hover:translate-x-1 transition-transform">
                  <Mail className="mr-2 text-pink-400 flex-shrink-0" size={18} />
                  <a href="mailto:watan8681@gmail.com" className="text-indigo-200 hover:text-white transition-colors">
                    watan8681@gmail.com
                  </a>
                </li>
              </ul>
              <div className="mt-6">
                <a 
                  href="#newsletter" 
                  className="relative inline-block overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-md"></span>
                  <span className="relative block bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-pink-500 hover:to-indigo-500 text-white py-2 px-4 rounded-md transition-all duration-300 transform group-hover:translate-y-[-2px] group-active:translate-y-[1px]">
                    Subscribe to Newsletter
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-indigo-700 my-6 relative">
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-900 px-4">
            <Heart size={16} className="text-pink-400 animate-pulse" />
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-indigo-300">
          <p>&copy; {currentYear} Watan. All rights reserved.</p>
          <div className="flex flex-wrap justify-center mt-4 md:mt-0 items-center">
            <span className="flex items-center">
              Made with <Heart size={14} className="mx-1 text-pink-400 animate-pulse" /> for education
            </span>
            <span className="mx-3 hidden md:block">|</span>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <span className="mx-2">•</span>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;