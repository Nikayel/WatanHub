import React from "react";
import Timeline from "./timeline";
import { motion } from "framer-motion";

const TimelineDemo = () => {
  const data = [
    {
      title: "2020",
      subtitle: "The Birth of CHYC",
      content: (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-xl shadow-lg transition-all"
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🚀</span>
            <h3 className="text-xl font-bold text-indigo-600">The Birth of CHYC</h3>
          </div>
          <p className="text-gray-700">
            An idea was born – we created CHYC with a vision to impact our community and make a meaningful difference.
          </p>
        </motion.div>
      ),
    },
    {
      title: "2021",
      subtitle: "First Community Event",
      content: (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-xl shadow-lg transition-all"
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🎉</span>
            <h3 className="text-xl font-bold text-indigo-600">First Community Event</h3>
          </div>
          <p className="text-gray-700">
            We held our first event, bringing together passionate individuals dedicated to positive change.
          </p>
        </motion.div>
      ),
    },
    {
      title: "2022",
      subtitle: "Growth & Expansion",
      content: (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-xl shadow-lg transition-all"
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">📈</span>
            <h3 className="text-xl font-bold text-indigo-600">Growth & Expansion</h3>
          </div>
          <p className="text-gray-700">
            We grew and expanded our initiatives, reaching more people and developing new programs.
          </p>
        </motion.div>
      ),
    },
    {
      title: "2023",
      subtitle: "Educational Partnerships",
      content: (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-xl shadow-lg transition-all"
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🤝</span>
            <h3 className="text-xl font-bold text-indigo-600">Educational Partnerships</h3>
          </div>
          <p className="text-gray-700">
            We gained more exposure and partnered with local schools to host financial aid and college info sessions.
          </p>
        </motion.div>
      ),
    },
    {
      title: "2024",
      subtitle: "Team Expansion",
      content: (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-xl shadow-lg transition-all"
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">👥</span>
            <h3 className="text-xl font-bold text-indigo-600">Team Expansion</h3>
          </div>
          <p className="text-gray-700">
            Our team welcomed talented new members, bringing fresh perspectives and skills to our mission.
          </p>
        </motion.div>
      ),
    },
    {
      title: "2025",
      subtitle: "Ongoing Impact",
      content: (
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white rounded-xl shadow-lg transition-all"
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">💪</span>
            <h3 className="text-xl font-bold text-indigo-600">Ongoing Impact</h3>
          </div>
          <p className="text-gray-700">
            Still going strong with ambitious plans for the future of our community!
          </p>
        </motion.div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Timeline data={data} horizontal={true} />
    </div>
  );
};

export default TimelineDemo;