import React from 'react';
import { cn } from '../../lib/utils';

export const Timeline = ({ data, horizontal }) => {
  return (
    <div className={cn("flex", horizontal ? "flex-row space-x-8" : "flex-col space-y-8")}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center min-w-[200px]">
          <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-4 shadow-lg">
            {item.title}
          </div>
          <div className="text-center text-sm md:text-base">
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
};
