import React, { useState } from "react";
import Navbar from "./Navigation/Navbar";
import Welcome from "./Sections/Welcome";
import UpcomingEvents from "./Sections/UpcomingEvents";
import Mentors from "./Sections/Mentors";
import MentorSignup from "./Sections/MentorSignup";
import FAQ from "./Sections/FAQ";
import About from "./Sections/About";
import Footer from "./Footer";
import Contact from "./Sections/Contact";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <>
      <Navbar 
        onAboutClick={() => setActiveTab("about")}
        onHomeClick={() => setActiveTab("home")}
        onContactClick={() => setActiveTab("contact")}
      />
      <main>
        {activeTab === "home" && (
          <>
            <Welcome />
            <UpcomingEvents />
            <Mentors />
            <MentorSignup />
            <FAQ />
          </>
        )}
        {activeTab === "about" && <About />}
        {activeTab === "contact" && <Contact />}
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
