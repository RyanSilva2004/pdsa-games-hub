"use client";
import { FC } from "react";

interface GameStatusProps {
  status: "playing" | "win" | "loss";
  timeTaken: number; // Time in seconds
}

const GameStatus: FC<GameStatusProps> = ({ status, timeTaken }) => {
  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (status === "playing") {
    return (
      <p className="mt-4 text-center">Time: {formatTime(timeTaken)}</p>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl  text-black mb-4">
          {status === "win" ? "Victory!" : "Game Over"}
        </h2>
        <p  className=" text-black">Time Taken: {formatTime(timeTaken)}</p>
        <button
          className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameStatus;