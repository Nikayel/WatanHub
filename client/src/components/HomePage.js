// src/components/HomePage.js
import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Navigation/Navbar";
import Welcome from "./Sections/Welcome";
import About from "./Sections/About";
import Contact from "./Sections/Contact";
import Footer from "./Footer";
import SignUpSteps from "./Sections/SingUpSteps";
import BlogList from "../pages/BlogList";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, X, GraduationCap, Calendar, Sparkles, ChevronDown, BookOpen, Users, Target } from "lucide-react";
import { supabase } from '../lib/supabase';
import FAQ from "./Sections/FAQ";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [contactOpen, setContactOpen] = useState(false);
  const [showFellowshipPopup, setShowFellowshipPopup] = useState(false);
  const [fellowshipInfo, setFellowshipInfo] = useState({
    start_date: 'August 1st, 2024',
    description: 'An intensive 8-week program designed to empower Afghan students with skills, mentorship, and opportunities for academic and professional success.'
  });

  // Refs for scroll animation sections
  const heroContentRef = useRef(null);
  const blogSectionRef = useRef(null);
  const signupSectionRef = useRef(null);
  const aboutSectionRef = useRef(null);

  // Check if sections are in view
  const isHeroContentInView = useInView(heroContentRef, { once: true, amount: 0.3 });
  const isBlogInView = useInView(blogSectionRef, { once: true, amount: 0.2 });
  const isSignupInView = useInView(signupSectionRef, { once: true, amount: 0.2 });
  const isAboutInView = useInView(aboutSectionRef, { once: true, amount: 0.2 });

  useEffect(() => {
    // Show fellowship popup after 5 seconds (less aggressive)
    const timer = setTimeout(() => {
      setShowFellowshipPopup(true);
    }, 5000);

    // Fetch fellowship info
    fetchFellowshipInfo();

    return () => clearTimeout(timer);
  }, []);

  const fetchFellowshipInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('fellowship_settings')
        .select('*')
        .single();

      if (!error && data) {
        setFellowshipInfo(data);
      }
    } catch (error) {
      console.log('Using default fellowship info');
    }
  };

  const scrollToContent = () => {
    document.getElementById('main-content')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar
        onHomeClick={() => setActiveTab("home")}
        onAboutClick={() => setActiveTab("about")}
        onContactClick={() => setContactOpen(true)}
      />

      <main className="flex-grow">
        {activeTab === "home" && (
          <>
            {/* Hero Section */}
            <Welcome onScrollClick={scrollToContent} />

            {/* Main Content Area - Clean Apple-style layout */}
            <div id="main-content" className="bg-white">
              {/* Hero Content Section - immediately after welcome */}
              <motion.section
                ref={heroContentRef}
                className="py-20 lg:py-32 bg-gray-50"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={isHeroContentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-center mb-20"
                  >
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                      Empowering Future Leaders
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                      We connect Afghan students with mentors, resources, and opportunities
                      to build brighter futures through education and community support.
                    </p>
                  </motion.div>

                  {/* Feature Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isHeroContentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Mentorship</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Connect with experienced mentors who guide your academic and professional journey.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Resources</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Access educational materials, scholarship opportunities, and career guidance.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Opportunities</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Discover internships, college programs, and pathways to success.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.section>

              {/* Latest Blog Posts Section */}
              <motion.section
                ref={blogSectionRef}
                className="py-20 lg:py-32 bg-white"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isBlogInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-center mb-16"
                  >
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                      Latest Updates
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      Stay informed with the latest news, insights, and opportunities from our community.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={isBlogInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <BlogList />
                  </motion.div>
                </div>
              </motion.section>

              {/* Get Started Section */}
              <motion.section
                ref={signupSectionRef}
                className="py-20 lg:py-32 bg-gray-50"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isSignupInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-center mb-16"
                  >
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                      Ready to Get Started?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      Join our community and take the first step towards your educational goals.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={isSignupInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12"
                  >
                    <SignUpSteps />
                  </motion.div>
                </div>
              </motion.section>

              {/* About Section */}
              <motion.section
                ref={aboutSectionRef}
                className="py-20 lg:py-32 bg-white"
              >
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={isAboutInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <About />
                </motion.div>
              </motion.section>

              {/* FAQ Section */}
              <section className="py-20 lg:py-32 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12">
                    <FAQ onContactClick={() => setContactOpen(true)} />
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="py-20 lg:py-32 bg-white">
                <Contact />
              </section>
            </div>
          </>
        )}

        {activeTab === "about" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12">
              <About />
            </div>
          </div>
        )}
      </main>

      <Footer
        onAboutClick={() => setActiveTab("about")}
        onContactClick={() => setContactOpen(true)}
      />

      {/* Contact modal */}
      {contactOpen && (
        <Contact isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      )}

      {/* Fellowship Popup - More subtle and Apple-like */}
      <AnimatePresence>
        {showFellowshipPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-32 right-8 z-50 max-w-sm"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-200/50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-base mb-1">Fellowship Program</h4>
                  <p className="text-sm text-gray-600 mb-3">Starting {fellowshipInfo.start_date}</p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setShowFellowshipPopup(false);
                        window.location.href = '/mentors';
                      }}
                      className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Learn More
                    </button>
                    <button
                      onClick={() => setShowFellowshipPopup(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowFellowshipPopup(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
