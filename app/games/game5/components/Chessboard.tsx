import { FC } from "react";


const Chessboard: FC = () => {
  const boardSize = 8;
  const squares = Array(boardSize).fill(null).map((_, row) =>
    Array(boardSize).fill(null).map((_, col) => ({ row, col }))
  );

  return (
    <div className="grid grid-cols-8 gap-0 w-[400px] h-[400px] border-2 border-gray-800">
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
    </div>
  );
};

export default Chessboard;