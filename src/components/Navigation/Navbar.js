// src/components/Navigation/Navbar.js
import React, { useState, useEffect } from "react";
import { Menu, User, LogOut, Home, Users, Info, Mail, ChevronRight, Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";

const Navbar = ({ onHomeClick, onAboutClick, onContactClick }) => {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Track scroll position for navbar appearance and active section
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Determine active section based on scroll position
      const sections = ["home", "mentors", "about", "contact"];
      const sectionElements = sections.map(id => 
        id === "home" ? document.body : document.querySelector(`#${id}`)
      );
      
      const scrollPosition = window.scrollY + 100;
      
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "#", id: "home", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "#mentors", id: "mentors", label: "Mentors", icon: <Users className="h-4 w-4 mr-2" /> },
    { href: "#about", id: "about", label: "About", icon: <Info className="h-4 w-4 mr-2" /> },
    { href: "#contact", id: "contact", label: "Contact", icon: <Mail className="h-4 w-4 mr-2" /> },
  ];

  const handleScrollToSection = (e, href, id) => {
    e.preventDefault();
    if (href === "#") {
      if (typeof onHomeClick === "function") {
        onHomeClick();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setActiveSection("home");
      return;
    }
    if (href === "#about") {
      if (typeof onAboutClick === "function") {
        onAboutClick();
      }
      setActiveSection("about");
      return;
    }
    if (href === "#contact") {
      if (typeof onContactClick === "function") {
        onContactClick();
      }
      setActiveSection("contact");
      return;
    }
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur transition-all duration-300",
        scrolled 
          ? "bg-white/90 dark:bg-gray-900/90 shadow-md" 
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <motion.h1 
              className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent logo-hover"
              whileHover={{ scale: 1.05 }}
            >
              Watan
            </motion.h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center">
            <ul className="flex space-x-8">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`text-sm font-medium relative nav-link ${
                      activeSection === item.id ? "text-indigo-600 dark:text-indigo-400" : ""
                    }`}
                    onClick={(e) => handleScrollToSection(e, item.href, item.id)}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <motion.span 
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-4/5 sm:w-80 p-0">
                <div className="h-full flex flex-col">
                  <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500">
                    <h2 className="text-2xl font-bold text-white">Watan</h2>
                    <p className="text-white/80 text-sm mt-1">Connecting through mentorship</p>
                  </div>
                  
                  <nav className="flex flex-col p-4 gap-1 flex-1">
                    {navItems.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        className={`flex items-center w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          activeSection === item.id ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : ""
                        }`}
                        onClick={(e) => {
                          handleScrollToSection(e, item.href, item.id);
                          closeMobileMenu();
                        }}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </a>
                    ))}
                  </nav>
                  
                  <div className="p-4 border-t dark:border-gray-700">
                    {!user ? (
                      <div className="space-y-3">
                        <Link to="/login" onClick={closeMobileMenu}>
                          <Button variant="outline" className="w-full">Login</Button>
                        </Link>
                        <Link to="/signup" onClick={closeMobileMenu}>
                          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">Join Now</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center p-2 border rounded-lg dark:border-gray-700">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-8 w-8 flex items-center justify-center text-white">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3 flex-1 truncate">
                            <p className="font-medium text-sm">{user.email}</p>
                          </div>
                        </div>
                        <Link to="/profile" className="block w-full" onClick={closeMobileMenu}>
                          <Button variant="outline" className="w-full">Profile</Button>
                        </Link>
                        <Button variant="outline" className="w-full" onClick={handleLogout}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="px-4">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                    Join Now
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-indigo-500 rounded-full"></span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 rounded-full pl-2 pr-3"
                    >
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-7 w-7 flex items-center justify-center text-white">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm truncate max-w-[100px]">
                        {user.email.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center p-2 border-b dark:border-gray-700">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-8 w-8 flex items-center justify-center text-white">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <p className="font-medium text-sm truncate max-w-[180px]">{user.email}</p>
                        <p className="text-xs text-gray-500">Member</p>
                      </div>
                    </div>
                    <div className="p-1">
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center p-2">
                          <User className="h-4 w-4 mr-2" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center p-2">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="p-2 text-red-500">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Navbar;