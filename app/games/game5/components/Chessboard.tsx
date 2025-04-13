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

  useEffect(() => {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    setKnightPosition({ row, col });
    setVisited(new Set([`${row}-${col}`]));
    setSolution(solveKnightsTourBacktracking(row, col));
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
    <div className="grid grid-cols-8 gap-0 w-[400px] h-[400px] border-2 border-gray-800 relative">
      {squares.map((row, rowIndex) =>
        row.map((square, colIndex) => (
          <div
    key={`${rowIndex}-${colIndex}`}
            className={`w-[50px] h-[50px] cursor-pointer ${
              (rowIndex + colIndex) % 2 === 0 ? "bg-white" : "bg-gray-400"
            } ${visited.has(`${rowIndex}-${colIndex}`) ? "bg-green-200" : ""}`}
            onClick={() => handleSquareClick(rowIndex, colIndex)}
          />
        ))
      )}
      <Knight position={knightPosition} />
    </div>
  );
};

export default Chessboard;