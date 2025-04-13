import React from 'react';
import TimelineDemo from '../ui/timeline-demo';

const About = () => (
  <section id="about" className="py-16 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">About CHYC</h2>
      <p className="text-center text-lg mb-12">
        CHYC is dedicated to bridging students to higher education through mentorship, events, and partnerships.
      </p>
      <TimelineDemo />
    </div>
  </section>
);

export default About;
