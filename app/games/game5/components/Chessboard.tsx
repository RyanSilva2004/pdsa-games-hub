"use client";
import { FC, useState, useEffect } from "react";
import Knight from "./Knight";
import { isValidKnightMove } from "../util/utils";
import { solveKnightsTourBacktracking } from "../logic/backtracking";

const Chessboard: FC = () => {
  const boardSize = 8;
  const [knightPosition, setKnightPosition] = useState({ row: 0, col: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [isComputingSolution, setIsComputingSolution] = useState(false);

  useEffect(() => {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    setKnightPosition({ row, col });
    setVisited(new Set([`${row}-${col}`]));
    setIsComputingSolution(true);
    solveKnightsTourBacktracking(row, col, 8, 500000, 1000)
      .then((result) => {
        setSolution(result);
        setIsComputingSolution(false);
      })
      .catch(() => {
        setSolution(null);
        setIsComputingSolution(false);
      });
  }, []);

  const handleSquareClick = (row: number, col: number) => {
    if (
      isValidKnightMove(knightPosition.row, knightPosition.col, row, col) &&
      !visited.has(`${row}-${col}`)
    ) {
      setKnightPosition({ row, col });
      setVisited((prev) => new Set(prev).add(`${row}-${col}`));
    }
  };

  const squares = Array(boardSize)
    .fill(null)
    .map((_, row) => Array(boardSize).fill(null).map((_, col) => ({ row, col })));

  return (
    <div className="relative">
      {isComputingSolution && (
        <div className="absolute top-2 left-2 bg-white p-2 rounded shadow">
          <p className="text-sm">Computing solution...</p>
        </div>
      )}
      <div className="grid grid-cols-8 gap-0 w-[400px] h-[400px] border-2 border-gray-800 relative">
        {squares.map((row, rowIndex) =>
          row.map((square, colIndex) => {
            const isVisited = visited.has(`${rowIndex}-${colIndex}`);
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-[50px] h-[50px] cursor-pointer ${
                  isVisited
                    ? "bg-green-200"
                    : (rowIndex + colIndex) % 2 === 0
                    ? "bg-white"
                    : "bg-gray-400"
                }`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              />
            );
          })
        )}
        <Knight position={knightPosition} />
      </div>
    </div>
  );
};

export default Chessboard;