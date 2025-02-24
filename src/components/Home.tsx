import React from "react";
import { motion } from "framer-motion";

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white p-6">
      <motion.h1
        className="text-4xl font-bold mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Ask Your Data
      </motion.h1>
      <motion.p
        className="text-lg mb-6 text-center max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Unlock insights from your data with our powerful AI-driven analytics.
        Simply ask and get instant answers!
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="bg-gray-700 text-white shadow-lg rounded-2xl p-6 max-w-md text-center">
          <p className="text-lg font-medium mb-4">
            Start exploring your data now.
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md">
            Get Started
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
