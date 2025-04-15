// src/components/Navigation/Navbar.js
import React, { useState, useEffect } from "react";
import { Menu, User, LogOut, Home, Users, Info, Mail, ChevronRight } from "lucide-react";
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
import AuthDialog from "../Auth/AuthDialog";
import { useAuth } from "../../lib/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";

const Navbar = ({ onHomeClick, onAboutClick, onContactClick }) => {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll position for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "#", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "#mentors", label: "Mentors", icon: <Users className="h-4 w-4 mr-2" /> },
    { href: "#about", label: "About", icon: <Info className="h-4 w-4 mr-2" /> },
    { href: "#contact", label: "Contact", icon: <Mail className="h-4 w-4 mr-2" /> },
  ];

  const handleScrollToSection = (e, href) => {
    e.preventDefault();
    if (href === "#") {
      if (typeof onHomeClick === "function") {
        onHomeClick();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (href === "#about") {
      if (typeof onAboutClick === "function") {
        onAboutClick();
      }
      return;
    }
    if (href === "#contact") {
      if (typeof onContactClick === "function") {
        onContactClick();
      }
      return;
    }
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <nav className="container flex h-16 items-center justify-between">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center"
        >
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
            aria-label="Watan Logo"
          >
            Watan
          </motion.h1>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 justify-center">
          <ul className="flex gap-6 items-center">
            {navItems.map((item) => (
              <motion.li 
                key={item.label}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {item.label === "About" || item.label === "Contact" ? (
                  <button
                    className="text-sm font-medium flex items-center relative group"
                    aria-label={item.label}
                    onClick={(e) => handleScrollToSection(e, item.href)}
                  >
                    <span className="transition-colors group-hover:text-primary">{item.label}</span>
                    <motion.span 
                      className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-indigo-500 to-purple-500"
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.2 }}
                    />
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className="text-sm font-medium flex items-center relative group"
                    aria-label={item.label}
                    onClick={(e) => handleScrollToSection(e, item.href)}
                  >
                    <span className="transition-colors group-hover:text-primary">{item.label}</span>
                    <motion.span 
                      className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: "0%" }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.2 }}
                    />
                  </a>
                )}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
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
                    <motion.div 
                      key={item.label}
                      whileHover={{ x: 5 }}
                      className="w-full"
                    >
                      {item.label === "About" || item.label === "Contact" ? (
                        <button
                          className="flex items-center w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          aria-label={item.label}
                          onClick={(e) => {
                            handleScrollToSection(e, item.href);
                            closeMobileMenu();
                          }}
                        >
                          {item.icon}
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </button>
                      ) : (
                        <a
                          href={item.href}
                          className="flex items-center w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          aria-label={item.label}
                          onClick={(e) => {
                            handleScrollToSection(e, item.href);
                            closeMobileMenu();
                          }}
                        >
                          {item.icon}
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </nav>
                
                <div className="p-4 border-t">
                  {!user ? (
                    <div className="space-y-3">
                      <AuthDialog
                        mode="login"
                        trigger={
                          <Button variant="outline" className="w-full" onClick={closeMobileMenu}>
                            Login
                          </Button>
                        }
                      />
                      <Link to="/signup" onClick={closeMobileMenu}>
                        <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                          Join Now
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center p-2 border rounded-lg">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-10 w-10 flex items-center justify-center text-white">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 flex-1 truncate">
                          <p className="font-medium">{user.email}</p>
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
        <AnimatePresence mode="wait">
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <AuthDialog
                    mode="login"
                    trigger={
                      <Button variant="ghost" className="rounded-full px-5 font-medium">
                        Login
                      </Button>
                    }
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link to="/signup">
                    <Button 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-full px-6 font-medium shadow-lg shadow-indigo-500/20"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      Join Now
                    </Button>
                  </Link>
                </motion.div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="rounded-full pl-3 pr-4 py-2 flex items-center gap-2 border border-gray-200 hover:border-gray-300 bg-white/50 hover:bg-white/80"
                    >
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-8 w-8 flex items-center justify-center text-white">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium truncate max-w-[120px]">
                        {user.email.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <div className="flex items-center justify-start gap-2 p-3 border-b">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500">Member</p>
                      </div>
                    </div>
                    <div className="p-1">
                      <DropdownMenuItem asChild className="p-2 cursor-pointer">
                        <a href="/profile" className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>Profile</span>
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-2 cursor-pointer">
                        <a href="/dashboard" className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Dashboard</span>
                        </a>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-1">
                      <DropdownMenuItem
                        className="p-2 cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </nav>
    </motion.header>
  );
};

export default Navbar;