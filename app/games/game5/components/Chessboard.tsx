"use client";
import { FC, useState, useEffect } from "react";
import Knight from "./Knight";
import GameStatus from "./GameStatus";
import { isValidKnightMove } from "../util/utils";
import { solveKnightsTourBacktracking } from "../logic/backtracking";

const Chessboard: FC = () => {
  const boardSize = 8;
  const [knightPosition, setKnightPosition] = useState({ row: 0, col: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [isComputingSolution, setIsComputingSolution] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "win" | "loss">(
    "playing"
  );

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameStatus === "playing") {
        setTimeTaken((Date.now() - startTime) / 1000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, startTime]);

  // Initialize board
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

  // Check game status after moves
  useEffect(() => {
    if (visited.size > 0) {
      checkGameStatus(visited);
    }
  }, [visited, knightPosition]);

  const checkGameStatus = (visited: Set<string>) => {
    if (visited.size === boardSize * boardSize) {
      setGameStatus("win");
    } else if (getValidMoves().length === 0) {
      setGameStatus("loss");
    }
  };

  const getValidMoves = () => {
    const moves = [
      [2, 1],
      [1, 2],
      [-1, 2],
      [-2, 1],
      [-2, -1],
      [-1, -2],
      [1, -2],
      [2, -1],
    ];
    const validMoves = moves
      .map(([dr, dc]) => ({
        row: knightPosition.row + dr,
        col: knightPosition.col + dc,
      }))
      .filter(
        ({ row, col }) =>
          row >= 0 &&
          row < boardSize &&
          col >= 0 &&
          col < boardSize &&
          !visited.has(`${row}-${col}`)
      );
    console.log("Valid moves:", validMoves);
    return validMoves;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus !== "playing") return;
    if (
      isValidKnightMove(knightPosition.row, knightPosition.col, row, col) &&
      !visited.has(`${row}-${col}`)
    ) {
      setKnightPosition({ row, col });
      const newVisited = new Set(visited).add(`${row}-${col}`);
      setVisited(newVisited);
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
            const isValidMove = getValidMoves().some(
              (move) => move.row === rowIndex && move.col === colIndex
            );
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-[50px] h-[50px] ${
                  gameStatus === "playing" ? "cursor-pointer" : "cursor-default"
                } relative ${
                  isVisited
                    ? "bg-green-200"
                    : isValidMove
                    ? "bg-yellow-200"
                    : (rowIndex + colIndex) % 2 === 0
                    ? "bg-white"
                    : "bg-gray-400"
                }`}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {isVisited && (
                  <span className="absolute top-0 left-1 text-xs text-black">
                    {visited.size -
                      [...visited].indexOf(`${rowIndex}-${colIndex}`)}
                  </span>
                )}
              </div>
            );
          })
        )}
        <Knight position={knightPosition} />
      </div>
      <GameStatus status={gameStatus} timeTaken={timeTaken} />
    </div>
  );
};

export default Chessboard;