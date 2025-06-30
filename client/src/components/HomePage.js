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
import BlogHomepageSection from "./BlogHomepageSection";
import NotificationPanel from "./common/NotificationPanel";
import { useAuth } from '../lib/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [contactOpen, setContactOpen] = useState(false);
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
    // Fetch fellowship info without showing popup
    fetchFellowshipInfo();
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

      {/* Notification Panel - Only shows for logged-in users */}
      <NotificationPanel fellowshipInfo={fellowshipInfo} />

      <main className="flex-grow">
        {activeTab === "home" && (
          <>
            {/* Hero Section */}
            <Welcome onScrollClick={scrollToContent} />

            {/* Main Content Area - Clean Apple-style layout */}
            <div id="main-content" className="bg-white">
              {user ? (
                // Logged-in user experience - Clean and focused
                <>
                  {/* Welcome Back Section */}
                  <motion.section className="py-12 lg:py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                      >
                        <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
                          Welcome Back! 👋
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                          Continue your educational journey with personalized resources and support.
                        </p>
                      </motion.div>

                      {/* Quick Actions - Mobile optimized */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-12">
                        <motion.a
                          href="/dashboard"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Target className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Dashboard</h3>
                          <p className="text-gray-600 text-sm">Track progress and access your personalized content</p>
                        </motion.a>

                        <motion.a
                          href="/blogs"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BookOpen className="h-6 w-6 text-green-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest Articles</h3>
                          <p className="text-gray-600 text-sm">Discover new insights and educational content</p>
                        </motion.a>

                        <motion.a
                          href="/get-involved"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1"
                        >
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Users className="h-6 w-6 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
                          <p className="text-gray-600 text-sm">Connect with peers and mentors</p>
                        </motion.a>
                      </div>
                    </div>
                  </motion.section>

                  {/* Blog Section for logged-in users */}
                  <BlogHomepageSection />
                </>
              ) : (
                // Non-logged-in user experience - Comprehensive but not overwhelming
                <>
                  {/* Hero Content Section - immediately after welcome */}
                  <motion.section
                    ref={heroContentRef}
                    className="py-16 lg:py-24 bg-gray-50"
                  >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={isHeroContentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                        className="text-center mb-16"
                      >
                        <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                          Empowering Future Leaders
                        </h2>
                        <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                          We connect Afghan students with mentors, resources, and opportunities
                          to build brighter futures through education and community support.
                        </p>
                      </motion.div>

                      {/* Feature Cards - Mobile optimized */}
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={isHeroContentInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
                      >
                        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Mentorship</h3>
                          <p className="text-gray-600 leading-relaxed">
                            Connect with experienced mentors who guide your academic and professional journey.
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                            <BookOpen className="h-6 w-6 text-green-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Resources</h3>
                          <p className="text-gray-600 leading-relaxed">
                            Access educational materials, scholarship opportunities, and career guidance.
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
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

                  {/* Blog Section */}
                  <BlogHomepageSection />

                  {/* About Section */}
                  <motion.section
                    ref={aboutSectionRef}
                    className="py-16 lg:py-24 bg-white"
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
                  <section className="py-16 lg:py-24 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-12">
                        <FAQ onContactClick={() => setContactOpen(true)} />
                      </div>
                    </div>
                  </section>
                </>
              )}
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
      <AnimatePresence>
        {contactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setContactOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setContactOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
              <Contact />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
