"use client"
import { FC, useState, useEffect } from "react";
import Knight from "./Knight";

const Chessboard: FC = () => {
  const boardSize = 8;
  const [knightPosition, setKnightPosition] = useState({ row: 0, col: 0 });

  useEffect(() => {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    setKnightPosition({ row, col });
  }, []);

  const squares = Array(boardSize).fill(null).map((_, row) =>
    Array(boardSize).fill(null).map((_, col) => ({ row, col }))
  );

  return (
    <div className="grid grid-cols-8 gap-0 w-[400px] h-[400px] border-2 border-gray-800 relative">
      {squares.map((row, rowIndex) =>
        row.map((square, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`w-[50px] h-[50px] ${
              (rowIndex + colIndex) % 2 === 0 ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))
      )}
      <Knight position={knightPosition} />
    </div>
  );
};

export default Chessboard;