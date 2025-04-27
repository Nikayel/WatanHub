import React, { useState, useEffect } from "react";
import { Menu, User, LogOut, Home, Users, Info, Mail, ChevronRight, X } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = ({ onHomeClick, onAboutClick, onContactClick }) => {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("admin")
      .select("id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => data && setIsAdmin(true));
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/mentors") {
      setActiveSection("mentors");
    }
  }, [location.pathname]);

  const navItems = [
    { id: "home", label: "Home", href: "#" },
    { id: "mentors", label: "Mentors", href: "/mentors" },
    { id: "about", label: "About", href: "#" },
    { id: "contact", label: "Contact", href: "#" },
  ];

  const clickItem = (e, href, id) => {
    if (id === "mentors") {
      return; // let Link handle mentors
    }

    e.preventDefault();

    if (id === "home") {
      if (onHomeClick) onHomeClick();
      else window.location.href = "/";
    }
    else if (id === "about") {
      if (onAboutClick) onAboutClick();
      else window.location.href = "/";
    }
    else if (id === "contact") {
      if (onContactClick) onContactClick();
      else window.location.href = "/";
    }

    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const doLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className={cn(
        "sticky top-0 z-40 w-full backdrop-blur transition-all duration-300",
        scrolled ? "bg-white/90 dark:bg-gray-900/90 shadow-md" : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2">
                <span className="text-white font-bold">W</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Watan
              </h1>
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:flex-1 justify-center">
            <ul className="flex items-center h-full">
              {navItems.map((i) => (
                <li key={i.id} className="px-4 h-full">
                  {i.id === "mentors" ? (
                    <Link
                      to={i.href}
                      className="relative h-full flex flex-col items-center justify-center group"
                    >
                      <span
                        className={cn(
                          "flex items-center transition-colors duration-300",
                          activeSection === i.id
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-300"
                        )}
                      >
                        <Users size={20} />
                        <span className="ml-2 font-medium">{i.label}</span>
                      </span>
                      {activeSection === i.id && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-md"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  ) : (
                    <a
                      href={i.href}
                      onClick={(e) => clickItem(e, i.href, i.id)}
                      className="relative h-full flex flex-col items-center justify-center group"
                    >
                      <span
                        className={cn(
                          "flex items-center transition-colors duration-300",
                          activeSection === i.id
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-300"
                        )}
                      >
                        {i.id === "home" && <Home size={20} />}
                        {i.id === "about" && <Info size={20} />}
                        {i.id === "contact" && <Mail size={20} />}
                        <span className="ml-2 font-medium">{i.label}</span>
                      </span>
                      {activeSection === i.id && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute bottom-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-md"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger>
                <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                {/* Close Button */}
                <div className="flex justify-end p-4">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Mobile Nav Items */}
                <div className="flex flex-col h-full p-4 space-y-1 mt-12">
                  {navItems.map((i) => (
                    <div key={i.id}>
                      {i.id === "mentors" ? (
                        <Link to={i.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full flex justify-between py-6">
                            {i.label}
                            <ChevronRight size={16} />
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={(e) => clickItem(e, i.href, i.id)}
                          className="w-full flex justify-between py-6"
                        >
                          {i.label}
                          <ChevronRight size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Auth Buttons */}
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 px-2 pb-6 space-y-3">
                  {user ? (
                    <>
                      <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          <Users size={16} /> {isAdmin ? "Admin Dashboard" : "Dashboard"}
                        </Button>
                      </Link>
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          <User size={16} /> Profile
                        </Button>
                      </Link>
                      <Button variant="destructive" onClick={doLogout} className="w-full">
                        <LogOut size={16} /> Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                          Join Now
                        </Button>
                      </Link>
                    </>
                  )}
                </div>

              </SheetContent>
            </Sheet>
          </div>

        </nav>
      </div>
    </motion.header>
  );
};

export default Navbar;
