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
import WinImage from "@/public/won.gif";
import LostImage from "@/public/over.gif";
import DrawImage from "@/public/draw.gif";
import Image from "next/image";
import { savePlayerWinResult, saveGameWithComputerTiming } from "../utils/dbLogger";


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
  const [playerWins, setPlayerWins] = useState(0);
  const [computerWins, setComputerWins] = useState(0);
  const [draws, setDraws] = useState(0);

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

      if (result === "X") {
        setPlayerWins((prev) => prev + 1);
      } else if (result === "O") {
        setComputerWins((prev) => prev + 1);
      } else {
        setDraws((prev) => prev + 1);
      }

      const resultData = getGameResultIfPlayerWins(
        newBoard,
        history,
        playerName,
        strategy
      );
      if (resultData) {
        console.log("Player winning result:", resultData);
        savePlayerWinResult(resultData);
      }
    } else if (newBoard.flat().every((cell) => cell !== null)) {
      setWinner("Draw");
      setDraws((prev) => prev + 1);
    }
  };

  const handleComputerTurn = () => {
    if (!isHumanTurn && !winner) {
      const start = performance.now();

      const { newBoard, newHistory } = handleComputerMove(
        board,
        history,
        strategy
      );

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
      saveGameWithComputerTiming(result);
    }
  }, [winner]);

  if (!playerNameSubmitted) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <h2 className="text-2xl font-semibold text-center">
          Enter Your Name to Start
        </h2>
        <input
          type="text"
          placeholder="Your name"
          className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <div className="flex space-x-4 items-center">
          <label className="text-sm font-medium">Level:</label>
          <select
            value={strategy}
            onChange={(e) =>
              setStrategy(e.target.value as "minimax" | "greedy")
            }
            className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="greedy">Easy</option>
            <option value="minimax">Hard</option>
          </select>
        </div>
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
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
    <div className="flex flex-col items-center space-y-6 p-3">
      {/* Winner */}
      {winner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-xs w-full">
            <h2 className="text-2xl font-semibold text-green-600 mb-3">
              {winner === "X"
                ? `${playerName}, you win! 🎉`
                : winner === "O"
                ? `Computer wins 😥`
                : "It's a draw!"}
            </h2>

            {winner === "X" && (
              <Image
                src={WinImage}
                alt="You Win"
                width={150}
                height={150}
                className="mx-auto mb-3 rounded-full"
              />
            )}
            {winner === "O" && (
              <Image
                src={LostImage}
                alt="You Lost"
                width={150}
                height={150}
                className="mx-auto mb-3 rounded-full"
              />
            )}
            {winner === "Draw" && (
              <Image
                src={DrawImage}
                alt="It's a Draw"
                width={150}
                height={150}
                className="mx-auto mb-3 rounded-full"
              />
            )}

            <button
              onClick={resetGame}
              className="mt-4 px-5 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <h2 className="text-xl font-medium text-center">
        Hello, {playerName}! It's {isHumanTurn ? "your" : "computer"} turn
      </h2>

      <div className="flex flex-row space-x-6 items-center">
        {/* Game Board */}
        <div className="flex flex-col items-center space-y-6 p-2">
          <div className="grid grid-cols-5 gap-1 mt-6">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className="w-16 h-16 border border-gray-400 text-2xl font-bold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 rounded transition duration-300"
                  onClick={() => handleClick(rowIndex, colIndex)}
                  disabled={!!cell || !!winner || !isHumanTurn}
                >
                  {cell}
                </button>
              ))
            )}
          </div>

          <div className="flex space-x-6 mt-6">
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
            >
              Restart Game
            </button>

            <button
              onClick={handleUndo}
              disabled={!canUndo || history.length < 2 || winner !== null}
              className={`px-6 py-3 rounded text-white ${
                !canUndo || history.length < 2 || winner
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600"
              } transition duration-300`}
            >
              Undo Last Move
            </button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg w-64 h-fit ms-5">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-2000">
              Game Scoreboard
            </h2>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Level</span>
              <span className="font-semibold text-gray-300">{strategy === "greedy" ? "Easy" : "Hard"}</span>
            </div>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Player</span>
              <span className="font-semibold text-gray-300">{playerName}</span>
            </div>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Player Wins</span>
              <span className="font-semibold text-green-400">{playerWins}</span>
            </div>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Computer Wins</span>
              <span className="font-semibold text-blue-400">
                {computerWins}
              </span>
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Draws</span>
              <span className="font-semibold text-yellow-400">{draws}</span>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}
