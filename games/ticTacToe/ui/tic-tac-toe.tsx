"use client";

import { useState } from "react";
import {
  emptyBoard,
  handleMove,
  handleComputerMove,
  checkWinner,
  handleUndoMove,
  BOARD_SIZE,
} from "@/games/ticTacToe/logic/gameLogic";

export function TicTacToe() {
  const [board, setBoard] = useState(emptyBoard());
  const [history, setHistory] = useState<string[][][]>([]);
  const [isHumanTurn, setIsHumanTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerNameSubmitted, setPlayerNameSubmitted] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const handleClick = (row: number, col: number) => {
    if (board[row][col] || winner || !isHumanTurn) return;

    const { newBoard, newHistory } = handleMove(board, history, row, col, "X");
    setBoard(newBoard);
    setHistory(newHistory);
    setIsHumanTurn(false);
    setCanUndo(true);
  };

  const handleUndo = () => {};

  const handleComputerTurn = () => {};

  const resetGame = () => {
    setBoard(emptyBoard());
    setHistory([]);
    setIsHumanTurn(true);
    setWinner(null);
    setCanUndo(false);
  };

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
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            if (playerName.trim()) {
              setPlayerNameSubmitted(true);
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
