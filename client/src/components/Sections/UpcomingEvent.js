import React from 'react';

const UpcomingEvents = () => (
  <section id="events-section">
    <h2>Upcoming Events</h2>
    <div className="event" data-event-id="1">
      <h3>Scholarship Night – April 10</h3>
      <button className="rsvp-btn" aria-expanded="false">RSVP</button>
      <div className="rsvp-form hidden">
        <input type="text" placeholder="Your Name" className="rsvp-name" aria-label="Your Name" />
        <input type="text" placeholder="Your Location" className="rsvp-location" aria-label="Your Location" />
        <input type="email" placeholder="you@mail.com" className="rsvp-email" aria-label="Your Email" />
        <button className="submit-rsvp">Submit</button>
      </div>
      <div className="rsvp-list"></div>
    </div>
    <div className="event" data-event-id="2">
      <h3>Poetry night – May 3</h3>
      <button className="rsvp-btn" aria-expanded="false">RSVP</button>
      <div className="rsvp-form hidden">
        <input type="text" placeholder="Your Name" className="rsvp-name" aria-label="Your Name" />
        <input type="text" placeholder="Your Location" className="rsvp-location" aria-label="Your Location" />
        <input type="email" placeholder="you@mail.com" className="rsvp-email" aria-label="Your Email" />
        <button className="submit-rsvp">Submit</button>
      </div>
      <div className="rsvp-list"></div>
    </div>
  </section>
);

export default UpcomingEvents;
