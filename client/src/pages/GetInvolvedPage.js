import React from "react";
import Navbar from "../components/Navigation/Navbar";
import Footer from "../components/Footer";
import GetInvolvedWYG from "../components/GetInvolvedWYG";
import { useNavigate } from "react-router-dom";

const GetInvolvedPage = () => {
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
            <main className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <GetInvolvedWYG />
                </div>
            </main>
            <Footer />
        </>
    );
};

export default GetInvolvedPage; 