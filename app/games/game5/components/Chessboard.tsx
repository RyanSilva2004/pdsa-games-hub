// components/Chessboard.tsx
"use client";
import { FC, useState, useEffect, useMemo } from "react";
import Knight from "./Knight";
import GameStatus from "./GameStatus";
import AlgorithmSelector from "./AlgorithmSelector";
import { isValidKnightMove } from "../util/utils";
import { solveKnightsTourBacktracking } from "../logic/backtracking";
import { solveKnightsTourWarnsdorff } from "../logic/warnsdorff";
import { saveGameResult } from "../util/gameService"

import { toast } from "react-hot-toast";

interface ChessboardProps {
  playerName: string;
}

const Chessboard: FC<ChessboardProps> = ({ playerName }) => {
  const boardSize = 8;
  const [knightPosition, setKnightPosition] = useState({ row: 0, col: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [visitedOrder, setVisitedOrder] = useState<{row: number, col: number}[]>([]);
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [isComputingSolution, setIsComputingSolution] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "win" | "loss">("playing");
  const [algorithm, setAlgorithm] = useState<"backtracking" | "warnsdorff">("backtracking");

  const showError = (message: string) => {
    toast.error(message, {
      position: "top-center",
      duration: 3000,
    });
  };

  const showSuccess = (message: string) => {
    toast.success(message, {
      position: "top-center",
      duration: 3000,
    });
  };

  const solveTour = async (row: number, col: number) => {
    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
      showError("Invalid starting position for knight");
      return;
    }

    setIsComputingSolution(true);
    
    try {
      let result;
      if (algorithm === "backtracking") {
        result = await solveKnightsTourBacktracking(
          row,
          col,
          boardSize,
          500000,
          1000
        );
      } else {
        result = await solveKnightsTourWarnsdorff(row, col, boardSize);
      }
      
      // if (!result) {
      //   throw new Error("Failed to find a solution");
      // }
      
      setSolution(result);
    } catch (error) {
      console.error("Failed to compute solution:", error);
      showError("Failed to compute solution. Please try again.");
      setSolution(null);
    } finally {
      setIsComputingSolution(false);
    }
  };

  const initializeGame = () => {
    try {
      const row = Math.floor(Math.random() * boardSize);
      const col = Math.floor(Math.random() * boardSize);
      setKnightPosition({ row, col });
      const initialVisited = new Set([`${row}-${col}`]);
      setVisited(initialVisited);
      setVisitedOrder([{row, col}]);
      solveTour(row, col);
      setStartTime(Date.now());
      setGameStatus("playing");
      setTimeTaken(0);
    } catch (error) {
      console.error("Game initialization failed:", error);
      showError("Failed to initialize game. Please refresh the page.");
    }
  };

  useEffect(() => {
    initializeGame();
  }, [algorithm]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameStatus === "playing") {
        setTimeTaken((Date.now() - startTime) / 1000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, startTime]);

  useEffect(() => {
    if (visited.size > 0) {
      checkGameStatus(visited);
    }
  }, [visited, knightPosition]);

  const getValidMoves = useMemo(() => {
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
    return () =>
      moves
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
  }, [knightPosition, visited]);

  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus !== "playing") {
      showError("Game has already ended. Start a new game.");
      return;
    }

    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
      showError("Invalid square selected");
      return;
    }

    if (visited.has(`${row}-${col}`)) {
      showError("This square has already been visited");
      return;
    }

    if (!isValidKnightMove(knightPosition.row, knightPosition.col, row, col)) {
      showError("Invalid knight move");
      return;
    }

    try {
      setKnightPosition({ row, col });
      const newVisited = new Set(visited).add(`${row}-${col}`);
      setVisited(newVisited);
      setVisitedOrder([...visitedOrder, {row, col}]);
    } catch (error) {
      console.error("Move processing failed:", error);
      showError("Failed to process move. Please try again.");
    }
  };

  const checkGameStatus = async (visited: Set<string>) => {
    try {
      if (visited.size === boardSize * boardSize) {
        setGameStatus("win");
        showSuccess("Congratulations! You completed the Knight's Tour!");
        await saveGameResult({
          playerName,
          status: "win",
          timeTaken: (Date.now() - startTime) / 1000,
          moves: visitedOrder,
          algorithm,
          timestamp: new Date(),
          boardSize,
        });
      } else if (getValidMoves().length === 0) {
        setGameStatus("loss");
        showError("Game Over! No more valid moves.");
        await saveGameResult({
          playerName,
          status: "loss",
          timeTaken: (Date.now() - startTime) / 1000,
          moves: visitedOrder,
          algorithm,
          timestamp: new Date(),
          boardSize,
        });
      }
    } catch (error) {
      console.error("Failed to save game result:", error);
      showError("Failed to save game result. Your score may not be recorded.");
    }
  };

  const resetGame = () => {
    try {
      initializeGame();
    } catch (error) {
      console.error("Game reset failed:", error);
      showError("Failed to reset game. Please refresh the page.");
    }
  };

  const squares = Array(boardSize)
    .fill(null)
    .map((_, row) => Array(boardSize).fill(null).map((_, col) => ({ row, col })));

  return (
    <div className="flex flex-col items-center gap-4">
      <AlgorithmSelector algorithm={algorithm} setAlgorithm={setAlgorithm} />
      <div className="relative">
        {isComputingSolution && (
          <div className="absolute top-2 left-2 bg-white p-2 rounded shadow">
            <p className="text-sm">Computing solution ({algorithm})...</p>
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
                      {visitedOrder.findIndex(move => 
                        move.row === rowIndex && move.col === colIndex
                      ) + 1}
                    </span>
                  )}
                </div>
              );
            })
          )}
          <Knight position={knightPosition} />
        </div>
        <GameStatus status={gameStatus} timeTaken={timeTaken} />
        <button
          onClick={resetGame}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Game
        </button>
      </div>
    </div>
  );
};

export default Chessboard;