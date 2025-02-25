import React from "react";
import { motion } from "framer-motion";

interface HomeProps {
  onBtnClick: () => void;
}

const Home: React.FC<HomeProps> = ({ onBtnClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 
      bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200 text-gray-900 
      dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-black dark:text-white"
    >
      <motion.h1
        className="text-4xl font-bold mb-4 
          text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500
          dark:text-white"
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
        <div className="shadow-lg rounded-2xl p-6 max-w-md text-center 
          bg-white border border-gray-300 text-gray-900
          dark:bg-gray-800 dark:text-white dark:border-gray-700"
        >
          <p className="text-lg font-medium mb-4">Start exploring your data now.</p>
          <button
            onClick={onBtnClick}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md"
          >
            Get Started
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
