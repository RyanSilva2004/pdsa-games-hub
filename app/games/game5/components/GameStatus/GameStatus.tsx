"use client";
import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaSadTear, FaRedo } from "react-icons/fa";

interface GameStatusProps {
  status: "playing" | "win" | "loss";
  timeTaken: number;
  onRestart?: () => void;
}

const GameStatus: FC<GameStatusProps> = ({ status, timeTaken, onRestart }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (status === "playing") {
    return (
      <div className="absolute -top-2 right-0 transform translate-y-full bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md z-10">
        <span className="font-medium text-gray-700 text-sm">
          ⏱️ {formatTime(timeTaken)}
        </span>
      </div>
    );
  }


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: -50, scale: 0.9 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 100 }}
          className={`relative p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
            status === "win"
              ? "bg-gradient-to-br from-emerald-400 to-teal-600"
              : "bg-gradient-to-br from-rose-400 to-pink-600"
          }`}
        >
          {/* Status Icon */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`flex items-center justify-center w-24 h-24 rounded-full ${
                status === "win" ? "bg-yellow-400" : "bg-purple-500"
              } shadow-lg`}
            >
              {status === "win" ? (
                <FaTrophy className="text-4xl text-white" />
              ) : (
                <FaSadTear className="text-4xl text-white" />
              )}
            </motion.div>
          </div>

          <div className="pt-12 text-center">
            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {status === "win" ? "Victory!" : "Game Over"}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/90 mb-6"
            >
              {status === "win"
                ? "You completed the Knight's Tour!"
                : "No more valid moves available"}
            </motion.p>

            {/* Time Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6"
            >
              <p className="text-white font-mono text-xl">
                ⏱️ {formatTime(timeTaken)}
              </p>
            </motion.div>

            {/* Restart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRestart || (() => window.location.reload())}
              className={`px-6 py-3 rounded-full font-semibold text-white flex items-center justify-center gap-2 mx-auto ${
                status === "win"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-purple-700 hover:bg-purple-800"
              } transition-colors shadow-lg`}
            >
              <FaRedo />
              Play Again
            </motion.button>
          </div>

          {/* Bottom shadow */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-3/4 h-2 bg-black/10 rounded-full blur-md"></div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameStatus;