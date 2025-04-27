import React from 'react';
import { Link } from 'react-router-dom'; // 👈 Add Link for navigation

const mentorsData = [
  {
    id: 1,
    name: "Hasibullah Banaie",
    position: "CHYC President",
    description: "Overcame challenges in Afghanistan to pursue higher education through a student VISA.",
    image: "/img/hassss.jpg",
  },
  {
    id: 2,
    name: "Najaf Ali",
    position: "CHYC IT Manager",
    description: "Software developer and current bachelor's student at CSUS.",
    image: "/img/nahaf.jpg",
  },
  {
    id: 3,
    name: "Ahmad Kamal",
    position: "CHYC Media",
    description: "IT professional and Cybersecurity bachelor's student at CSUSB.",
    image: "/img/ahmad.jpg",
  },
  // Add more mentors as needed
];

const MentorCard = ({ mentor }) => (
  <div className="relative bg-white rounded-xl shadow-lg overflow-hidden min-w-[300px] snap-center transform transition duration-300 hover:scale-105 hover:shadow-2xl">
    <img src={mentor.image} alt={mentor.name} className="w-full h-48 object-cover" />
    <div className="p-6">
      <h3 className="text-xl font-semibold">{mentor.name}</h3>
      <p className="text-primary font-medium">{mentor.position}</p>
      <p className="text-gray-600 mt-2">{mentor.description}</p>
    </div>
  </div>
);

const Mentors = () => (
  <section className="py-16 bg-gradient-to-r from-gray-50 to-gray-100">
    <div className="container mx-auto px-4">

      {/* Mentors list */}
      <h2 className="text-3xl font-bold text-center mb-8">Our Mentors</h2>
      <div className="flex space-x-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8">
        {mentorsData.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}
      </div>

      {/* Become a Mentor Section */}
      <div className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Become a Mentor</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Inspire and guide the next generation. If you have valuable experience to share, join our growing community of mentors!
        </p>
        <Link to="/mentor-application">
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition">
            Apply to Become a Mentor
          </button>
        </Link>
      </div>

    </div>
  </section>
);

export default Mentors;
