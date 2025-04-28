import React from "react";
import Navbar from "../components/Navigation/Navbar";
import Footer from "../components/Footer";
import Mentors from "../components/Sections/Mentors";
import { useNavigate } from "react-router-dom";

const MentorsPage = () => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleAboutClick = () => {
    navigate("/", { state: { openAbout: true } });
  };

  const handleContactClick = () => {
    navigate("/", { state: { openContact: true } });
  };

  return (
    <>
      <Navbar
        onHomeClick={handleHomeClick}
        onAboutClick={handleAboutClick}
        onContactClick={handleContactClick}
      />
      <main>
        <Mentors />
      </main>
      <Footer />
    </>
  );
};

export default MentorsPage;
