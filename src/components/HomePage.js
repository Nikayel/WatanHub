import React from 'react';
import Navbar from './Navigation/Navbar';
import Welcome from './Sections/Welcome';
import UpcomingEvents from './Sections/UpcomingEvents';
import Mentors from './Sections/Mentors';
import MentorSignup from './Sections/MentorSignup';
import FAQ from './Sections/FAQ';
import About from './Sections/About';
import Contact from './Sections/Contact';
import Footer from './Footer';

const HomePage = () => {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <Welcome />
        <UpcomingEvents />
        <Mentors />
        <MentorSignup />
        <FAQ />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
