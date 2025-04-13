import React from "react";
import { Timeline } from "./timeline";

export function TimelineDemo() {
  const data = [
    {
      title: "2020",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-4">
            An idea was born. We created CHYC.
          </p>
        </div>
      ),
    },
    {
      title: "2021",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-4">
            We held our first event.
          </p>
        </div>
      ),
    },
    {
      title: "2022",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-4">
            We grew and expanded.
          </p>
        </div>
      ),
    },
    {
      title: "2023",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-4">
            We gained more exposure and partnered with local schools to host financial aid and college info sessions.
          </p>
        </div>
      ),
    },
    {
      title: "2024",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-4">
            Our team got new members.
          </p>
        </div>
      ),
    },
    {
      title: "2025",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base font-normal mb-4">
            Still going strong!
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <div className="max-w-screen-xl mx-auto py-8 px-4">
        <Timeline data={data} horizontal={true} />
      </div>
    </div>
  );
};
export default TimelineDemo;