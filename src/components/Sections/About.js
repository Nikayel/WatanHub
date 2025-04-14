import React from "react";
import TimelineDemo from "../ui/timeline-demo";

const About = () => (
  <section id="about" className="py-16 relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
    <div className="absolute inset-0 opacity-30">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="heroglow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill="url(#heroglow)" />
        <circle cx="80" cy="80" r="20" fill="url(#heroglow)" />
      </svg>  
    </div>

    <div className="container mx-auto px-4 relative z-10">
      <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Our Journey</h2>
      <p className="text-gray-700 text-xl max-w-2xl mx-auto text-center mb-12">
        From humble beginnings to creating lasting impact - trace the evolution of CHYC through the years.
      </p>
      <TimelineDemo />
    </div>
  </section>
);

export default About;