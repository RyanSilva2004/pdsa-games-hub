"use client";

import { useEffect, useState } from "react";
import {
  emptyBoard,
  handleMove,
  handleComputerMove,
  checkWinner,
  handleUndoMove,
  BOARD_SIZE,
} from "@/games/ticTacToe/logic/gameLogic";
import { getGameResultIfPlayerWins } from "../utils/playerGameLogger";
import { buildGameResult } from "../utils/computerGameLogger";

export function TicTacToe() {
  const [board, setBoard] = useState(emptyBoard());
  const [history, setHistory] = useState<string[][][]>([]);
  const [isHumanTurn, setIsHumanTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerNameSubmitted, setPlayerNameSubmitted] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [strategy, setStrategy] = useState<"minimax" | "greedy">("greedy");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [computerMoveDurations, setComputerMoveDurations] = useState<number[]>(
    []
  );

  const handleClick = (row: number, col: number) => {
    if (board[row][col] || winner || !isHumanTurn) return;

    const { newBoard, newHistory } = handleMove(board, history, row, col, "X");
    setBoard(newBoard);
    setHistory(newHistory);
    setIsHumanTurn(false);
    setCanUndo(true);
    checkForWinner(newBoard);
  };

  const handleUndo = () => {
    const { newBoard, newHistory, undoAvailable } = handleUndoMove(history);
    setBoard(newBoard);
    setHistory(newHistory);
    setIsHumanTurn(true);
    setWinner(null);
    setCanUndo(undoAvailable);
  };

  const checkForWinner = (newBoard: string[][]) => {
    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
  
      const resultData = getGameResultIfPlayerWins(newBoard, history, playerName, strategy);
      if (resultData) {
        console.log("Player winning result:", resultData);
        // send this to backend
      }
    } else if (newBoard.flat().every((cell) => cell !== null)) {
      setWinner("Draw");
    }
  };

  const handleComputerTurn = () => {
    if (!isHumanTurn && !winner) {
      const start = performance.now(); 
  
      const { newBoard, newHistory } = handleComputerMove(board, history, strategy);
  
      const end = performance.now(); 
      const duration = end - start;
  
      setComputerMoveDurations((prev) => [...prev, duration]);
  
      setBoard(newBoard);
      setHistory(newHistory);
      setIsHumanTurn(true);
      setCanUndo(true);
      checkForWinner(newBoard);
    }
  };
  

  const resetGame = () => {
    setBoard(emptyBoard());
    setHistory([]);
    setIsHumanTurn(true);
    setWinner(null);
    setCanUndo(false);
    setStartTime(new Date());
    setEndTime(null);
    setComputerMoveDurations([]);
  };

  useEffect(() => {
    if (winner && startTime && !endTime) {
      const end = new Date();
      setEndTime(end);

      const result = buildGameResult(
        board,
        strategy,
        playerName,
        startTime,
        end,
        computerMoveDurations
      );

      console.log("Computer game result:", result);
      // send this to backend
    }
  }, [winner]);

  if (!playerNameSubmitted) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-xl font-semibold">Enter Your Name to Start</h2>
        <input
          type="text"
          placeholder="Your name"
          className="border rounded px-3 py-2"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <div className="flex space-x-4 items-center">
          <label className="text-sm font-medium">Strategy:</label>
          <select
            value={strategy}
            onChange={(e) =>
              setStrategy(e.target.value as "minimax" | "greedy")
            }
            className="border rounded px-2 py-1"
          >
            <option value="greedy">Easy</option>
            <option value="minimax">Hard</option>
          </select>
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            if (playerName.trim()) {
              setPlayerNameSubmitted(true);
              setStartTime(new Date());
            }
          }}
        >
          Start Game
        </button>
      </div>
    );
  }

  if (!isHumanTurn && !winner) {
    handleComputerTurn();
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Winner */}
      {winner && (
        <div className="mt-6 p-4 bg-gray-100 rounded shadow text-center w-64">
          <h2 className="text-xl font-semibold text-green-600">
            {winner === "X"
              ? `${playerName}, you win! 🎉`
              : winner === "O"
              ? `Computer wins 😥`
              : "It's a draw!"}
          </h2>
        </div>
      )}

      <h2 className="text-lg font-medium">
        Hello, {playerName}! It's {isHumanTurn ? "your" : "computer"} turn
      </h2>

      {/* Game Board */}
      <div className="grid grid-cols-5 gap-1">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className="w-16 h-16 border border-gray-400 text-2xl font-bold flex items-center justify-center hover:bg-gray-100"
              onClick={() => handleClick(rowIndex, colIndex)}
              disabled={!!cell || !!winner || !isHumanTurn}
            >
              {cell}
            </button>
          ))
        )}
      </div>

      <div className="flex space-x-4 mt-4">
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Restart Game
        </button>

        <button
          onClick={handleUndo}
          disabled={!canUndo || history.length < 2 || winner !== null}
          className={`px-4 py-2 rounded text-white ${
            !canUndo || history.length < 2 || winner
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
        >
          Undo Last Round
        </button>
      </div>
    </div>
  );
}
