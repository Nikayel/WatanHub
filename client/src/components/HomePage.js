// src/components/HomePage.js
import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Navigation/Navbar";
import Welcome from "./Sections/Welcome";
import UpcomingEvents from "./Sections/UpcomingEvents";
import FAQ from "./Sections/FAQ";
import About from "./Sections/About";
import Contact from "./Sections/Contact";
import Footer from "./Footer";
import SignUpSteps from "./Sections/SingUpSteps";
import BlogList from "../pages/BlogList";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [contactOpen, setContactOpen] = useState(false);

  // Refs for scroll animation sections
  const blogSectionRef = useRef(null);
  const signupSectionRef = useRef(null);
  const faqSectionRef = useRef(null);

  // Check if sections are in view
  const isBlogInView = useInView(blogSectionRef, { once: false, amount: 0.2 });
  const isSignupInView = useInView(signupSectionRef, { once: false, amount: 0.2 });
  const isFaqInView = useInView(faqSectionRef, { once: false, amount: 0.2 });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar
        onHomeClick={() => setActiveTab("home")}
        onAboutClick={() => setActiveTab("about")}
        onContactClick={() => setContactOpen(true)}
      />

      <main className="flex-grow">
        {activeTab === "home" && (
          <>
            <Welcome />

            {/* Content sections with improved layout and scroll animations */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Latest Blog Posts Section with Apple-style scroll animations */}
              <motion.section
                id="blog-list"
                ref={blogSectionRef}
                className="mb-24 py-12"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isBlogInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center mb-16"
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                    <span className="inline-block border-b-2 border-indigo-500 pb-2">Latest Posts</span>
                  </h2>
                  <p className="max-w-2xl mx-auto text-gray-600 text-lg">
                    Stay up to date with the latest news, resources, and opportunities in our community.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isBlogInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-xl shadow-md p-6 sm:p-8 transform-gpu"
                >
                  <BlogList />
                </motion.div>
              </motion.section>

              {/* Sign Up Steps with card layout and scroll animations */}
              <motion.section
                id="signup-steps"
                ref={signupSectionRef}
                className="mb-24 py-12"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isSignupInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-md p-6 sm:p-8">
                    <SignUpSteps />
                  </div>
                </motion.div>
              </motion.section>

              {/* FAQ Section with improved styling and scroll animations */}
              <motion.section
                id="faq-section"
                ref={faqSectionRef}
                className="mb-16 py-12"
              >
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isFaqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
                    <FAQ onContactClick={() => setContactOpen(true)} />
                  </div>
                </motion.div>
              </motion.section>
            </div>
          </>
        )}

        {activeTab === "about" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
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
    </div>
  );
};

export default HomePage;
