"use client";
import { FC, useState } from "react";
import { FaUser, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";

interface NameInputProps {
  onSubmit: (name: string) => void;
}

const NameInput: FC<NameInputProps> = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }
    
    if (trimmedName.length > 20) {
      setError("Name must be less than 20 characters");
      return;
    }
    
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) {
      setError("Name can only contain letters, numbers, and spaces");
      return;
    }
    
    setError(null);
    onSubmit(trimmedName);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isFocused ? "text-indigo-500" : "text-gray-400"}`}>
            <FaUser className="h-5 w-5" />
          </div>
          
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter your knight's name"
            className={`block w-full pl-10 pr-3 py-3 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 ${error ? "focus:ring-red-500" : "focus:ring-indigo-500"} focus:border-transparent transition-all duration-200  bg-black backdrop-blur-sm`}
            maxLength={20}
          />
          
          {name && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <span className="text-xs text-gray-500">
                {name.length}/20
              </span>
            </motion.div>
          )}
        </div>
        
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 group"
        >
          <span className="font-medium">Begin the Quest</span>
          <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
        </motion.button>
      </form>
      
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Your name will be recorded in the Knight's Hall of Fame</p>
      </div>
    </motion.div>
  );
};

export default NameInput;