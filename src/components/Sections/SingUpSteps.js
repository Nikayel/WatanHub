import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const stepsData = [
  {
    title: "Step 1: Sign up & Get Started",
    content:
      "Complete a short eligibility form so we understand your goals, English level, and internet access.",
  },
  {
    title: "Step 2: Kick‑off Orientation",
    content:
      "Join a virtual orientation where we learn about you and match you with one of our mentors.",
  },
  {
    title: "Step 3: Meet Your Mentor",
    content:
      "We pair you with a volunteer who has successfully navigated the same application process you're about to begin.",
  },
  {
    title: "Step 4: Work the Road‑map",
    content:
      "Monthly mentor check‑ins: essay reviews, TOEFL/SAT practice, recommendation letters, and application fee waivers.",
  },
  {
    title: "Step 5: Submit",
    content:
      "We do a final quality check, support scholarship and visa steps.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const SignUpSteps = () => {
  return (
    <section id="signup-steps" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center text-gray-800">
          Your Journey With Us
        </h2>
        
        <motion.div
          className="max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {stepsData.map((step, index) => (
            <motion.div 
              key={index} 
              className="relative"
              variants={itemVariants}
            >
              <div className="flex mb-8">
                {/* Left side - Step number */}
                <div className="mr-6 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {index + 1}
                  </div>
                  {index < stepsData.length - 1 && (
                    <div className="h-full border-l-2 border-dashed border-indigo-200 ml-6 mt-2"></div>
                  )}
                </div>
                
                {/* Right side - Content */}
                <div className="flex-grow">
                  <div className="p-5 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="text-lg font-medium mb-2 text-indigo-700">
                      {step.title.replace(/Step \d+: /, '')}
                    </h3>
                    <p className="text-gray-600">
                      {step.content}
                    </p>
                  </div>
                  
                  {/* Connector arrow */}
                  {index < stepsData.length - 1 && (
                    <div className="hidden md:flex items-center justify-end mt-2 mb-4 pr-4">
                      <ArrowRight size={16} className="text-indigo-400" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          <motion.div 
            className="text-center mt-10"
            variants={itemVariants}
          >
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
              Begin Your Journey
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SignUpSteps;