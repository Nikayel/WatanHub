import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "../../lib/utils";

const Timeline = ({ data, horizontal = false }) => {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, []);

  // Set up scroll tracking on the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  // Transform scroll progress to a height for the beam
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  // Calculate years range
  const startYear = parseInt(data[0]?.title) || 2020;
  const endYear = parseInt(data[data.length - 1]?.title) || 2025;
  const yearRange = endYear - startYear;

  return (
    <div
      className={cn("w-full font-sans md:px-10")}
      ref={containerRef}
    >
      {/* Year progress indicator */}
      {isClient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-6xl mx-auto mb-12 px-4 relative"
        >
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left"
            />
          </div>
          <div className="flex justify-between mt-2">
            {data.map((item, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-xs font-medium text-gray-600"
              >
                {item.title}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => {
          // Calculate left position based on year
          const year = parseInt(item.title);
          const yearPosition = ((year - startYear) / yearRange) * 100;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex justify-start pt-10 md:pt-20 md:gap-10"
            >
              <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                {/* Date Circle */}
                <div className="h-16 w-16 absolute left-3 md:left-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-white">
                    {item.title}
                  </span>
                </div>
                {/* Date for larger screens */}
                <h3 className="hidden md:block text-xl md:pl-24 md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {item.title}
                </h3>
              </div>
              <div className="relative pl-24 pr-4 md:pl-4 w-full">
                <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-indigo-600">
                  {item.title}
                </h3>
                <div>
                  {item.content}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Animated beam that follows the scroll */}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[3px] bg-[linear-gradient(to_bottom,transparent,neutral-200,transparent)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[3px] bg-gradient-to-t from-purple-500 via-indigo-500 to-transparent rounded-full shadow-lg shadow-indigo-500/50"
          />
        </div>
      </div>
    </div>
  );
};

export default Timeline;