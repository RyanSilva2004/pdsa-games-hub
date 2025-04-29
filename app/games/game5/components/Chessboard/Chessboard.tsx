"use client";
import { FC, useState, useEffect, useMemo } from "react";
import Knight from "../Knight/Knight";
import GameStatus from "../GameStatus/GameStatus";
import AlgorithmSelector from "../AlgorithmSelector/AlgorithmSelector";
import { isValidKnightMove } from "../../util/utils/utils";
import { solveKnightsTourBacktracking } from "../../logic/backtracking/backtracking";
import { solveKnightsTourWarnsdorff } from "../../logic/warnsdorff/warnsdorff";
import { saveGameResult } from "../../util/gameService/gameService"

import { toast } from "react-hot-toast";

interface ChessboardProps {
  playerName: string;
}


interface AlgorithmTiming {
  algorithm: "backtracking" | "warnsdorff";
  calculationTime: number;
  moves: { row: number; col: number;  }[];
}

const Chessboard: FC<ChessboardProps> = ({ playerName }) => {
  const boardSize = 8;
  const [knightPosition, setKnightPosition] = useState({ row: 0, col: 0 });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [visitedOrder, setVisitedOrder] = useState<{row: number, col: number,}[]>([]);
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [isComputingSolution, setIsComputingSolution] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "win" | "loss">("playing");
  const [algorithm, setAlgorithm] = useState<"backtracking" | "warnsdorff">("backtracking");
  const [suggestedMove, setSuggestedMove] = useState<{row: number, col: number} | null>(null);
  const [algorithmTimings, setAlgorithmTimings] = useState<AlgorithmTiming>({
    algorithm: "backtracking",
    calculationTime: 0,
    moves: []
  });

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

  const calculateNextMove = async () => {
    if (gameStatus !== "playing") return;
    
    const startCalcTime = performance.now();
    try {
     
      const validMoves = getValidMoves();
      if (validMoves.length === 0) return;
      
      let nextMove;
      if (algorithm === "backtracking") {
     
        if (solution && solution.length > 0) {
          
          const nextPositionFromSolution = solution.find((pos, index) => {
            if (index === 0) return false; 
            const posStr = `${pos[0]}-${pos[1]}`;
            return !visited.has(posStr);
          });
          
          if (nextPositionFromSolution) {
            nextMove = { row: nextPositionFromSolution[0], col: nextPositionFromSolution[1] };
          } else {
           
            nextMove = validMoves[0];
          }
        } else {
       
          nextMove = validMoves[0];
        }
      } else {
       
        let bestMove = null;
        let minOnwardMoves = Infinity;
        
        for (const move of validMoves) {
       
          const onwardMoves = countOnwardMoves(move.row, move.col);
          if (onwardMoves < minOnwardMoves) {
            minOnwardMoves = onwardMoves;
            bestMove = move;
          }
        }
        
        nextMove = bestMove || validMoves[0];
      }
      
      const endCalcTime = performance.now();
      const calcTime = endCalcTime - startCalcTime;
      
      setSuggestedMove(nextMove);
      
  
      setAlgorithmTimings(prev => ({
        ...prev,
        calculationTime: prev.calculationTime + calcTime,
        moves: [...prev.moves, {...nextMove, timeTaken: calcTime}]
      }));
      
    } catch (error) {
      console.error("Failed to calculate next move:", error);
    }
  };
  
  
  const countOnwardMoves = (row: number, col: number) => {
    const possibleMoves = [
      [2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]
    ];
    
    let count = 0;
    const tempVisited = new Set(visited);
    tempVisited.add(`${row}-${col}`);
    
    for (const [dr, dc] of possibleMoves) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (
        newRow >= 0 && newRow < boardSize &&
        newCol >= 0 && newCol < boardSize &&
        !tempVisited.has(`${newRow}-${newCol}`)
      ) {
        count++;
      }
    }
    
    return count;
  };

  const solveTour = async (row: number, col: number) => {
    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
      showError("Invalid starting position for knight");
      return;
    }

    setIsComputingSolution(true);
    
    try {
      const startSolveTime = performance.now();
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
      const endSolveTime = performance.now();
      
      setSolution(result);
      
      
      setAlgorithmTimings({
        algorithm,
        calculationTime: endSolveTime - startSolveTime,
        moves: []
      });
      

      calculateNextMove();
      
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
      setVisitedOrder([{row, col, }]);
      setSuggestedMove(null);
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
  
 
  useEffect(() => {
    if (gameStatus === "playing") {
      calculateNextMove();
    }
  }, [knightPosition, algorithm]);

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
      
      const moveTimeTaken = performance.now();
      
      setKnightPosition({ row, col });
      const newVisited = new Set(visited).add(`${row}-${col}`);
      setVisited(newVisited);
      
    
      setVisitedOrder([...visitedOrder, {row, col, }]);
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
        const movesForSaving = visitedOrder.map(({row, col}) => ({row, col}));
        await saveGameResult({
          playerName,
          status: "win",
          timeTaken: (Date.now() - startTime) / 1000,
          moves: movesForSaving,
          algorithm,
          timestamp: new Date(),
          algorithmPerformance: {
            totalCalculationTime: algorithmTimings.calculationTime,
            moveTimings: algorithmTimings.moves.map(move => ({
              row: move.row,
              col: move.col,
            }))
          }
        });
      } else if (getValidMoves().length === 0) {
        setGameStatus("loss");
        showError("Game Over! No more valid moves.");
        const movesForSaving = visitedOrder.map(({row, col}) => ({row, col}))
        await saveGameResult({
          playerName,
          status: "loss",
          timeTaken: (Date.now() - startTime) / 1000,
          moves: movesForSaving,
          algorithm,
          timestamp: new Date(),
          algorithmPerformance: {
            totalCalculationTime: algorithmTimings.calculationTime,
            moveTimings: algorithmTimings.moves.map(move => ({
              row: move.row,
              col: move.col,
            }))
          }
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
              const isSuggestedMove = suggestedMove && 
                                      suggestedMove.row === rowIndex && 
                                      suggestedMove.col === colIndex;
              return (
                <div
                key={`${rowIndex}-${colIndex}`}
                data-testid="chess-square"
                className={`w-[50px] h-[50px] ${
                  gameStatus === "playing" ? "cursor-pointer" : "cursor-default"
                } relative ${
                  isVisited
                    ? "bg-green-200"
                    : isSuggestedMove
                    ? "bg-yellow-200"
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
        

        
        <GameStatus 
          status={gameStatus} 
          timeTaken={timeTaken} 
          onRestart={resetGame}  
        />
        
        <button
          onClick={resetGame}
          className="relative mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg 
              xmlns="http:www.w3.org/2000/svg" 
              className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            New Game
          </span>
          
      
          <span className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          
  
          <span className="absolute inset-0 overflow-hidden">
            <span className="absolute top-1/2 left-1/2 w-0 h-0 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 group-hover:w-64 group-hover:h-64 group-hover:opacity-10 transition-all duration-700"></span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default Chessboard;