import React, { useState, useEffect } from "react";
import { Menu, User, LogOut, Home, Users, Info, Mail, ChevronRight, X, Rocket, Target } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Navbar = ({ onHomeClick, onAboutClick, onContactClick }) => {
  const { user, signOut, isAdmin, isMentor, isStudent } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === "/mentors") {
      setActiveSection("mentors");
    } else if (location.pathname === "/our-vision") {
      setActiveSection("our-vision");
    } else if (location.pathname === "/get-involved") {
      setActiveSection("get-involved");
    }
  }, [location.pathname]);

  const navItems = [
    { id: "home", label: "Home", href: "#" },
    { id: "mentors", label: "General", href: "/mentors" },
    { id: "about", label: "Our Journey", href: "#" },
    { id: "our-vision", label: "Our Vision", href: "/our-vision" },
    { id: "get-involved", label: "Get Involved", href: "/get-involved" },
    // { id: "contact", label: "Contact", href: "#" },
  ];

  const clickItem = (e, href, id) => {
    e.preventDefault();

    if (id === "home") {
      if (onHomeClick) onHomeClick();
      navigate("/");
    } else if (id === "about" || id === "contact") {
      navigate("/");
      setTimeout(() => {
        if (id === "about" && onAboutClick) onAboutClick();
        if (id === "contact" && onContactClick) onContactClick();
      }, 50);
    } else if (id === "mentors") {
      navigate("/mentors");
    } else if (id === "our-vision") {
      navigate("/our-vision");
    } else if (id === "get-involved") {
      navigate("/get-involved");
    }

    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const doLogout = async () => {
    // Immediately set loading state and close the menu
    setLoggingOut(true);
    setMobileMenuOpen(false);

    try {
      toast.success('Logging you out...');

      // Log current localStorage state for debugging
      console.log('LocalStorage before logout:',
        Object.keys(localStorage).filter(key =>
          key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
        )
      );

      const result = await signOut();

      // If we actually get here (unlikely due to redirect), handle the result
      if (!result.success) {
        console.error('Logout unsuccessful, forcing page reload');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Forcing page reload...');

      // If anything fails, force a page reload
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
    // Don't reset loggingOut state as we'll be redirected
  };

  const getDashboardLink = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isMentor) return "/mentor/dashboard";
    return "/dashboard";
  };

  const getDashboardText = () => {
    if (isAdmin) return "Admin Dashboard";
    if (isMentor) return "Mentor Dashboard";
    return "Dashboard";
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:flex-1 justify-center">
            <ul className="flex items-center h-full">
              {navItems.map((navItem) => (
                <li key={navItem.id} className="px-4 h-full">
                  {navItem.id === "mentors" || navItem.id === "our-vision" ? (
                    <Link
                      to={navItem.href}
                      className="relative h-full flex flex-col items-center justify-center group"
                    >
                      <span className={cn(
                        "flex items-center transition-colors duration-300",
                        activeSection === navItem.id
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-300"
                      )}>
                        {navItem.id === "mentors" && <Users size={20} />}
                        {navItem.id === "our-vision" && <Target size={20} />}
                        <span className="ml-2 font-medium">{navItem.label}</span>
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={navItem.href}
                      onClick={(e) => clickItem(e, navItem.href, navItem.id)}
                      className="relative h-full flex flex-col items-center justify-center group"
                    >
                      <span className={cn(
                        "flex items-center transition-colors duration-300",
                        activeSection === navItem.id
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-600 dark:text-gray-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-300"
                      )}>
                        {navItem.id === "home" && <Home size={20} />}
                        {navItem.id === "about" && <Info size={20} />}
                        {navItem.id === "contact" && <Mail size={20} />}
                        {navItem.id === "get-involved" && <Rocket size={20} />}
                        <span className="ml-2 font-medium">{navItem.label}</span>
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile-First Join Watan Youth Group Banner */}
          {(location.pathname === "/" || location.pathname === "/dashboard") && (
            <>
              {/* Mobile Full-Width Banner - Shows on all mobile devices */}
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="lg:hidden fixed top-16 left-2 right-2 z-50"
                id="mobile-watan-banner"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 8px 25px rgba(16, 185, 129, 0.6)",
                      "0 12px 35px rgba(220, 38, 38, 0.8)",
                      "0 8px 25px rgba(16, 185, 129, 0.6)"
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 6
                  }}
                  onClick={() => navigate("/get-involved")}
                  className="relative rounded-3xl p-4 shadow-2xl border-3 overflow-hidden cursor-pointer active:scale-95 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #16a34a 40%, #dc2626 100%)',
                    borderColor: '#f59e0b',
                    borderWidth: '3px'
                  }}
                >
                  {/* Enhanced Afghan pattern overlay */}
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.5'%3E%3Ccircle cx='15' cy='15' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }}></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50"
                      >
                        <img
                          src="/web-app-manifest-192x192.png"
                          alt="WatanHub Logo"
                          className="h-7 w-7"
                        />
                      </motion.div>
                      <div className="text-white flex-1">
                        <p className="text-base sm:text-lg font-bold">Join Watan Youth Group! 🇦🇫</p>
                        <p className="text-xs sm:text-sm text-green-100">Tap here to apply now →</p>
                      </div>
                    </div>

                    <motion.div
                      animate={{ x: [0, 8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-white"
                    >
                      <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                    </motion.div>
                  </div>

                  {/* Enhanced pulsing effect for mobile */}
                  <motion.div
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity
                    }}
                    className="absolute inset-0 bg-white rounded-3xl"
                  ></motion.div>
                </motion.div>

                {/* Enhanced dismissible button for mobile */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('mobile-watan-banner').style.display = 'none';
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg border-2 border-white"
                >
                  ×
                </motion.button>
              </motion.div>

              {/* Desktop Banner (original smaller version) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3, duration: 0.6, type: "spring", damping: 25 }}
                className="hidden lg:flex fixed right-8 top-24 z-40"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      rotate: [0, -1, 1, -1, 0],
                      scale: [1, 1.01, 1]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatDelay: 8
                    }}
                    onClick={() => navigate("/get-involved")}
                    className="relative rounded-2xl p-4 shadow-xl border-2 overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #16a34a 40%, #dc2626 100%)',
                      borderColor: '#f59e0b'
                    }}
                  >
                    <div className="relative z-10 flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30"
                      >
                        <img
                          src="/web-app-manifest-192x192.png"
                          alt="WatanHub Logo"
                          className="h-5 w-5"
                        />
                      </motion.div>
                      <div className="text-white">
                        <p className="text-sm font-bold whitespace-nowrap">Join Watan Youth Group! 🇦🇫</p>
                        <p className="text-xs text-green-100">Click Get Involved ↗</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Dismissible feature for desktop */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.parentElement.parentElement.style.display = 'none';
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-md"
                  >
                    ×
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                    Join Now
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="ghost">
                    {getDashboardText()}
                  </Button>
                </Link>
                {!isAdmin && (
                  <Link to="/profile">
                    <Button variant="ghost">Profile</Button>
                  </Link>
                )}
                <Button
                  onClick={doLogout}
                  disabled={loggingOut}
                  variant="destructive"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm hover:shadow"
                >
                  {loggingOut ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-0 border-r-0 border-white rounded-full"></span>
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
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
                <div className="flex flex-col h-full p-4 space-y-1 mt-12 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900">
                  {navItems.map((mobileNavItem) => (
                    <div key={mobileNavItem.id}>
                      {mobileNavItem.id === "mentors" || mobileNavItem.id === "our-vision" ? (
                        <Link to={mobileNavItem.href} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full flex justify-between py-6">
                            {mobileNavItem.label}
                            <ChevronRight size={16} />
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={(e) => clickItem(e, mobileNavItem.href, mobileNavItem.id)}
                          className="w-full flex justify-between py-6"
                        >
                          {mobileNavItem.label}
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
                      <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          {getDashboardText()}
                        </Button>
                      </Link>
                      {!isAdmin && (
                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full">
                            Profile
                          </Button>
                        </Link>
                      )}
                      <Button variant="destructive" onClick={doLogout} disabled={loggingOut} className="w-full flex items-center justify-center gap-2">
                        {loggingOut ? (
                          <>
                            <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-0 border-r-0 border-white rounded-full"></span>
                            <span>Logging out...</span>
                          </>
                        ) : (
                          <>
                            <LogOut size={16} />
                            <span>Logout</span>
                          </>
                        )}
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
