import React from "react";
import Navbar from "../components/Navigation/Navbar";
import Footer from "../components/Footer";
import Mentors from "../components/Sections/Mentors"; // Mentor list + become a mentor

const MentorsPage = () => {
  return (
    <>
      <Navbar />
      <main>
        <Mentors />
      </main>
      <Footer />
    </>
  );
};

export default MentorsPage;
