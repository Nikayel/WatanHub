import React from "react";
import Timeline from "./timeline";

const TimelineDemo = () => {
  const data = [
    {
      title: "2020",
      content: (
        <p className="mb-4">
          An idea was born – we created CHYC.
        </p>
      ),
    },
    {
      title: "2021",
      content: (
        <p className="mb-4">
          We held our first event.
        </p>
      ),
    },
    {
      title: "2022",
      content: (
        <p className="mb-4">
          We grew and expanded.
        </p>
      ),
    },
    {
      title: "2023",
      content: (
        <p className="mb-4">
          We gained more exposure and partnered with local schools to host financial aid and college info sessions.
        </p>
      ),
    },
    {
      title: "2024",
      content: (
        <p className="mb-4">
          Our team got new members.
        </p>
      ),
    },
    {
      title: "2025",
      content: (
        <p className="mb-4">
          Still going strong!
        </p>
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
