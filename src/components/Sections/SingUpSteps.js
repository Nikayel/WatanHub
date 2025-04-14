import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const stepsData = [
  {
    title: "Step 1: Sign Up",
    content:
      "Provide your basic details like name, email, and password. This is your gateway to joining our vibrant community.",
  },
  {
    title: "Step 2: Complete Profile",
    content:
      "Fill in additional information (education, interests, etc.) so we can tailor your experience and match you with the right mentors.",
  },
  {
    title: "Step 3: Get Matched",
    content:
      "Our system reviews your profile and pairs you with mentors whose expertise aligns with your academic and career aspirations.",
  },
  {
    title: "Step 4: Join the Community",
    content:
      "Engage with fellow students, attend events, and access exclusive resources that propel you toward success.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

const SignUpSteps = () => {
  return (
    <section id="signup-steps" className="py-16 bg-gray-100">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8 text-indigo-800">
          What Happens Next?
        </h2>
        <motion.div
          className="flex flex-col md:flex-row md:justify-around gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {stepsData.map((step, index) => (
            <motion.div
              key={index}
              className="p-6 border rounded-lg shadow-md bg-white hover:shadow-2xl transition duration-300"
              variants={cardVariants}
            >
              <h3 className="text-2xl font-semibold mb-2 text-indigo-600">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm md:text-base">
                {step.content}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SignUpSteps;
