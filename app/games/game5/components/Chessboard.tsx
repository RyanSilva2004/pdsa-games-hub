
"use client";
import { FC, useState, useEffect, useMemo } from "react";
import Knight from "./Knight";
import GameStatus from "./GameStatus";
import AlgorithmSelector from "./AlgorithmSelector";
import { isValidKnightMove } from "../util/utils";
import { solveKnightsTourBacktracking } from "../logic/backtracking";
import { solveKnightsTourWarnsdorff } from "../logic/warnsdorff";
import { saveGameResult } from "../util/gameService";
import { useRouter } from "next/navigation";

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
  const [gameStatus, setGameStatus] = useState<"playing" | "win" | "loss">(
    "playing"
  );
  const [algorithm, setAlgorithm] = useState<"backtracking" | "warnsdorff">(
    "backtracking"
  );
  const router = useRouter();

  // Function to solve the knight's tour based on selected algorithm
  const solveTour = async (row: number, col: number) => {
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
      setSolution(result);
    } catch (error) {
      console.error("Failed to compute solution:", error);
      setSolution(null);
    } finally {
      setIsComputingSolution(false);
    }
  };

  // Initialize board
  useEffect(() => {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    setKnightPosition({ row, col });
    const initialVisited = new Set([`${row}-${col}`]);
    setVisited(initialVisited);
    setVisitedOrder([{row, col}]);
    solveTour(row, col);
    setStartTime(Date.now());
  }, [algorithm]);

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameStatus === "playing") {
        setTimeTaken((Date.now() - startTime) / 1000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, startTime]);

  // Check game status after moves
  useEffect(() => {
    if (visited.size > 0) {
      checkGameStatus(visited);
    }
  }, [visited, knightPosition]);

  const checkGameStatus = async (visited: Set<string>) => {
    if (visited.size === boardSize * boardSize) {
      setGameStatus("win");
      await saveGameResult({
        playerName,
        status: "win",
        timeTaken: (Date.now() - startTime) / 1000,
        moves: visitedOrder,
        algorithm,
        timestamp: new Date(),
   
      });
    } else if (getValidMoves().length === 0) {
      setGameStatus("loss");
      await saveGameResult({
        playerName,
        status: "loss",
        timeTaken: (Date.now() - startTime) / 1000,
        moves: visitedOrder,
        algorithm,
        timestamp: new Date(),
       
      });
    }
  };

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
    if (gameStatus !== "playing") return;
    if (
      isValidKnightMove(knightPosition.row, knightPosition.col, row, col) &&
      !visited.has(`${row}-${col}`)
    ) {
      setKnightPosition({ row, col });
      const newVisited = new Set(visited).add(`${row}-${col}`);
      setVisited(newVisited);
      setVisitedOrder([...visitedOrder, {row, col}]);
    }
  };

  const resetGame = () => {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    setKnightPosition({ row, col });
    const initialVisited = new Set([`${row}-${col}`]);
    setVisited(initialVisited);
    setVisitedOrder([{row, col}]);
    setGameStatus("playing");
    setStartTime(Date.now());
    setTimeTaken(0);
    solveTour(row, col);
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