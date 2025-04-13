// src/components/HomePage.js
import React, { useState } from "react";
import Navbar from "./Navigation/Navbar";
import Welcome from "./Sections/Welcome";
import UpcomingEvents from "./Sections/UpcomingEvents";
import Mentors from "./Sections/Mentors";
import MentorSignup from "./Sections/MentorSignup";
import FAQ from "./Sections/FAQ";
import About from "./Sections/About"; // Timeline-based About section
import Contact from "./Sections/Contact"; // Contact component (modal)
import Footer from "./Footer";

const HomePage = () => {
  // activeTab controls the regular content; contactOpen controls the modal overlay
  const [activeTab, setActiveTab] = useState("home");
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <Navbar
        onHomeClick={() => setActiveTab("home")}
        onAboutClick={() => setActiveTab("about")}
        onContactClick={() => setContactOpen(true)}
      />
      <main>
        {activeTab === "home" && (
          <>
            <Welcome />
            <UpcomingEvents />
            <Mentors />
            <MentorSignup />
            {/* Pass the onContactClick callback to FAQ */}
            <FAQ onContactClick={() => setContactOpen(true)} />
          </>
        )}
        {activeTab === "about" && <About />}
      </main>
      <Footer />

      {/* Render the Contact modal when contactOpen is true */}
      {contactOpen && (
        <Contact isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      )}
    </>
  );
};

export default HomePage;
