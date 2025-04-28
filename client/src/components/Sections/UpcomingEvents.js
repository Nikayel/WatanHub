import React from 'react';

const UpcomingEvents = () => (
  <section id="events-section" className="py-16 bg-gray-100">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-10">Upcoming Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Event Card */}
        <div className="event p-6 bg-white rounded-xl shadow-md transform transition hover:scale-105 hover:shadow-xl">
          <h3 className="text-xl font-semibold mb-2">Scholarship Night – April 10</h3>
          <p className="text-gray-600 mb-4">Learn about funding opportunities and scholarships to empower your academic journey.</p>
          <button className="rsvp-btn px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition">
            RSVP
          </button>
        </div>
        {/* Duplicate Event Card with different content */}
        <div className="event p-6 bg-white rounded-xl shadow-md transform transition hover:scale-105 hover:shadow-xl">
          <h3 className="text-xl font-semibold mb-2">Poetry Night – May 3</h3>
          <p className="text-gray-600 mb-4">An evening of creative expression and art. Come share your words and listen to inspiring poetry.</p>
          <button className="rsvp-btn px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition">
            RSVP
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default UpcomingEvents;
