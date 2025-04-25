"use client";
import { FC } from "react";
import { FaChessBoard, FaChessKnight } from "react-icons/fa";

interface AlgorithmSelectorProps {
  algorithm: "backtracking" | "warnsdorff";
  setAlgorithm: (algorithm: "backtracking" | "warnsdorff") => void;
}

const AlgorithmSelector: FC<AlgorithmSelectorProps> = ({
  algorithm,
  setAlgorithm,
}) => {
  return (
    <div className="mb-6 w-full max-w-md mx-auto">
      <div className="relative">
        <label
          htmlFor="algorithm-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select Algorithm
        </label>

        <div className="relative">
          <select
            id="algorithm-select"
            value={algorithm}
            onChange={(e) =>
              setAlgorithm(e.target.value as "backtracking" | "warnsdorff")
            }
            className="appearance-none w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700 cursor-pointer"
          >
            <option value="backtracking">Backtracking Algorithm</option>
            <option value="warnsdorff">Warnsdorff's Heuristic</option>
          </select>

          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaChessBoard className="h-5 w-5 text-gray-400" />
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span
            className={`flex items-center ${
              algorithm === "backtracking" ? "text-indigo-600 font-medium" : ""
            }`}
          >
            <FaChessKnight className="mr-1" /> Exhaustive search
          </span>
          <span
            className={`flex items-center ${
              algorithm === "warnsdorff" ? "text-indigo-600 font-medium" : ""
            }`}
          >
            <FaChessKnight className="mr-1" /> Heuristic approach
          </span>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmSelector;