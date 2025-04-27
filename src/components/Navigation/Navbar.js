import React, { useState, useEffect } from "react";
import { Menu, User, LogOut, Home, Users, Info, Mail, ChevronRight, X } from "lucide-react";
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

  // header background on scroll
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  // check admin flag
  useEffect(() => {
    if (!user) return;
    supabase
      .from("admin")
      .select("id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => data && setIsAdmin(true));
  }, [user]);

  const navItems = [
    { href: "#", id: "home", label: "Home", icon: <Home size={20} /> },
    { href: "#mentors", id: "mentors", label: "Mentors", icon: <Users size={20} /> },
    { href: "#about", id: "about", label: "About", icon: <Info size={20} /> },
    { href: "#contact", id: "contact", label: "Contact", icon: <Mail size={20} /> },
  ];

  const clickItem = (e, href, id) => {
    e.preventDefault();
    if (id === "home") onHomeClick();
    else if (id === "about") onAboutClick();
    else if (id === "contact") onContactClick();
    else {
      const t = document.getElementById("mentors");
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
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
        scrolled
          ? "bg-white/90 dark:bg-gray-900/90 shadow-md"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2">
                <span className="text-white font-bold">W</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Watan
              </h1>
            </motion.div>
          </Link>

          {/* Desktop nav: hidden on mobile */}
          <div className="hidden md:flex md:flex-1 justify-center">
            <ul className="flex items-center h-full">
              {navItems.map((i) => (
                <li key={i.id} className="px-4 h-full">
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
                      {i.icon}
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
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile hamburger: flex on mobile, hidden at md+ */}
          <div className="flex md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                {/* Close button */}
                <div className="flex justify-end p-4">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Mobile menu content */}
                <div className="flex flex-col h-full p-4">
                  {/* Mobile Brand */}
                  <div className="py-8 flex justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">W</span>
                      </div>
                      <div className="absolute -bottom-6 w-full text-center">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                          Watan
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto mt-12 px-2">
                    <div className="space-y-1">
                      {navItems.map((i) => (
                        <motion.div
                          key={i.id}
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >
                          <Button
                            variant={activeSection === i.id ? "default" : "ghost"}
                            onClick={(e) => clickItem(e, i.href, i.id)}
                            className={cn(
                              "w-full justify-between text-base py-6",
                              activeSection === i.id
                                ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <span className="flex items-center gap-3">
                              {i.icon}
                              {i.label}
                            </span>
                            <ChevronRight size={16} className="opacity-50" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* User Controls */}
                  <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 px-2 pb-6">
                    {user ? (
                      <>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <User size={20} className="text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div>
                              <p className="font-medium">{user.email || "User"}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isAdmin ? "Administrator" : "Member"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="block">
                          <Button
                            variant="outline"
                            className="w-full flex items-center gap-2 justify-start"
                          >
                            <Users size={16} />
                            {isAdmin ? "Admin Dashboard" : "Dashboard"}
                          </Button>
                        </Link>
                        <Link to="/profile" className="block">
                          <Button
                            variant="outline"
                            className="w-full flex items-center gap-2 justify-start"
                          >
                            <User size={16} /> Profile
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          onClick={doLogout}
                          className="w-full flex items-center gap-2 justify-start"
                        >
                          <LogOut size={16} /> Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="block">
                          <Button
                            variant="outline"
                            className="w-full"
                          >
                            Login
                          </Button>
                        </Link>
                        <Link to="/signup" className="block">
                          <Button
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          >
                            Join Now
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                      Join Now
                    </Button>
                  </motion.div>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"}>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    <Users size={16} /> {isAdmin ? "Admin Dashboard" : "Dashboard"}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    <User size={16} /> Profile
                  </Button>
                </Link>
                <Button
                  onClick={doLogout}
                  variant="ghost"
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
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