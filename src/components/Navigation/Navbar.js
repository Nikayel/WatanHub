import React, { useState, useEffect } from "react";
import { Menu, User, LogOut, Home, Users, Info, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = ({ onHomeClick, onAboutClick, onContactClick }) => {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('admin')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setIsAdmin(true);
      }
    };

    checkAdmin();
  }, [user]);

  const navItems = [
    { href: "#", id: "home", label: "Home", icon: <Home size={24} /> },
    { href: "#mentors", id: "mentors", label: "Mentors", icon: <Users size={24} /> },
    { href: "#about", id: "about", label: "About", icon: <Info size={24} /> },
    { href: "#contact", id: "contact", label: "Contact", icon: <Mail size={24} /> },
  ];

  const handleScrollToSection = (e, href, id) => {
    e.preventDefault();
    if (id === "home") {
      onHomeClick();
    } else if (id === "about") {
      onAboutClick();
    } else if (id === "contact") {
      onContactClick();
    } else {
      const target = document.getElementById("mentors");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActiveSection(id);
  };

  const handleLogout = async () => {
    await signOut();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className={cn(
        "sticky top-0 z-50 w-full backdrop-blur transition-all duration-300",
        scrolled ? "bg-white/90 dark:bg-gray-900/90 shadow-md" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <motion.h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Watan
            </motion.h1>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:flex-1 justify-center">
            <ul className="flex items-center h-full">
              {navItems.map(item => (
                <li key={item.id} className="px-4 h-full flex items-center">
                  <a
                    href={item.href}
                    onClick={e => handleScrollToSection(e, item.href, item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center h-full transition-colors",
                      activeSection === item.id ? "text-indigo-600" : "text-gray-600"
                    )}
                  >
                    {item.icon}
                    <span className="text-xs mt-1 font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-4/5 sm:w-80">
                <div className="flex flex-col gap-4 p-6">
                  {navItems.map(item => (
                    <Button
                      key={item.id}
                      onClick={e => {
                        handleScrollToSection(e, item.href, item.id);
                        closeMobileMenu();
                      }}
                      className="text-sm font-medium hover:text-indigo-600 flex items-center gap-2"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                  ))}

                  {/* Auth Actions */}
                  {user ? (
                    <>
                      <Link to="/profile" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full flex items-center gap-2">
                          <User size={16} /> Profile
                        </Button>
                      </Link>

                      {isAdmin ? (
                        <Link to="/admin/dashboard" onClick={closeMobileMenu}>
                          <Button variant="outline" className="w-full flex items-center gap-2">
                            <Users size={16} /> Admin Dashboard
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/dashboard" onClick={closeMobileMenu}>
                          <Button variant="outline" className="w-full flex items-center gap-2">
                            <Users size={16} /> Dashboard
                          </Button>
                        </Link>
                      )}

                      <Button variant="destructive" onClick={handleLogout} className="w-full flex items-center gap-2">
                        <LogOut size={16} /> Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full">Login</Button>
                      </Link>
                      <Link to="/signup" onClick={closeMobileMenu}>
                        <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">
                          Join Now
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">Join Now</Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {isAdmin ? (
                  <Link to="/admin/dashboard">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Users size={16} /> Admin Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard">
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Users size={16} /> Dashboard
                    </Button>
                  </Link>
                )}
                
                <Link to="/profile">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User size={16} /> Profile
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="ghost" className="text-red-600 flex items-center gap-2">
                  <LogOut size={16} /> Logout
                </Button>
              </div>
            )}
          </div>

        </nav>
      </div>
    </motion.header>
  );
};

export default Navbar;
