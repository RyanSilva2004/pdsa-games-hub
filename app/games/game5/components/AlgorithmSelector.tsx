"use client";
import { FC } from "react";

interface AlgorithmSelectorProps {
  algorithm: "backtracking" | "warnsdorff";
  setAlgorithm: (algorithm: "backtracking" | "warnsdorff") => void;
}

const AlgorithmSelector: FC<AlgorithmSelectorProps> = ({
  algorithm,
  setAlgorithm,
}) => {
  return (
    <div className="mb-4">
      <label className="mr-2">Select Algorithm:</label>
      <select
        value={algorithm}
        onChange={(e) =>
          setAlgorithm(e.target.value as "backtracking" | "warnsdorff")
        }
        className="p-2 border rounded"
      >
        <option value="backtracking">Backtracking</option>
        <option value="warnsdorff">Warnsdorff's Heuristic</option>
      </select>
    </div>
  );
};

export default AlgorithmSelector;