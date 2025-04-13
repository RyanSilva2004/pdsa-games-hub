// app/games/game5/components/Chessboard.tsx
"use client";
import { FC, useState, useEffect } from "react";
import Knight from "./Knight";

const Chessboard: FC = () => {
  const boardSize = 8;
  const [knightPosition, setKnightPosition] = useState({ row: 0, col: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set([`0,0`]));

  useEffect(() => {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    setKnightPosition({ row, col });
    setVisited(new Set([`${row},${col}`]));
  }, []);

  const getValidMoves = (row: number, col: number) => {
    const moves = [
      { row: row - 2, col: col - 1 },
      { row: row - 2, col: col + 1 },
      { row: row - 1, col: col - 2 },
      { row: row - 1, col: col + 2 },
      { row: row + 1, col: col - 2 },
      { row: row + 1, col: col + 2 },
      { row: row + 2, col: col - 1 },
      { row: row + 2, col: col + 1 },
    ];
    return moves.filter(
      (move) =>
        move.row >= 0 &&
        move.row < boardSize &&
        move.col >= 0 &&
        move.col < boardSize
    );
  };

  const handleSquareClick = (row: number, col: number) => {
    const validMoves = getValidMoves(knightPosition.row, knightPosition.col);
    if (
      validMoves.some((move) => move.row === row && move.col === col) &&
      !visited.has(`${row},${col}`)
    ) {
      setKnightPosition({ row, col });
      setVisited((prev) => new Set(prev).add(`${row},${col}`));
    }
  };

  const squares = Array(boardSize)
    .fill(null)
    .map((_, row) =>
      Array(boardSize)
        .fill(null)
        .map((_, col) => ({ row, col }))
    );

  return (
    <div className="grid grid-cols-8 gap-0 w-[400px] h-[400px] border-2 border-gray-800 relative">
      {squares.map((row, rowIndex) =>
        row.map((square, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-[50px] h-[50px] ${
              (rowIndex + colIndex) % 2 === 0 ? "bg-white" : "bg-gray-400"
            } ${visited.has(`${rowIndex},${colIndex}`) ? "bg-green-200" : ""}`}
            onClick={() => handleSquareClick(rowIndex, colIndex)}
          />
        ))
      )}
      <Knight position={knightPosition} />
    </div>
  );
};

export default Chessboard;