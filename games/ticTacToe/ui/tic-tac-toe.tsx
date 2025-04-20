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
import {
  savePlayerWinResult,
  saveGameWithComputerTiming,
  getTopWinnersToday,
} from "../utils/dbLogger";

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
  const [showHelp, setShowHelp] = useState(false);
  const [easyWinners, setEasyWinners] = useState<{ name: string; wins: number }[]>([]);
  const [hardWinners, setHardWinners] = useState<{ name: string; wins: number }[]>([]);
  const [isLoadingWinners, setIsLoadingWinners] = useState(false);

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
      fetchScores();
    }
  }, [winner]);

  const fetchScores = async () => {
    setIsLoadingWinners(true);
    try {
      const easy = await getTopWinnersToday(strategy);
      const hard = await getTopWinnersToday(strategy);
      setEasyWinners(easy);
      setHardWinners(hard);
    } finally {
      setIsLoadingWinners(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [strategy]);

  if (!playerNameSubmitted) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4">
        <h2 className="text-2xl font-semibold text-center">
          Enter Your Name to Start
        </h2>
        <input
          type="text"
          placeholder="Your name"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button
          className="text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
          onClick={() => setPlayerNameSubmitted(true)}
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
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 text-center shadow-lg relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              How to Play
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              <b>Welcome to 5x5 Tic Tac Toe!</b>
              <br />
              <br />
              Try to get five of your <b>'X'</b>s in a row:{" "}
              <i>vertically, horizontally, or diagonally</i>, before the
              computer lines up five <b>'O'</b>s.
              <br />
              <br />
              You’re always <b>'X'</b> and go first.
              <br />
              You can undo only your last move.
              <br />
              <br />
              Good luck and have fun!
            </p>
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✖
            </button>
            <button
              onClick={() => setShowHelp(false)}
              className="text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-row space-x-6 items-center">
        <div className="flex flex-col items-center space-y-6 p-2">
          <div className="flex items-center space-x-4">
            <span
              className={`text-sm font-medium ${
                strategy === "greedy" ? "text-green-500" : "text-gray-400"
              }`}
            >
              Easy
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={strategy === "minimax"}
                onChange={(e) => {
                  const newStrategy = e.target.checked ? "minimax" : "greedy";
                  setStrategy(newStrategy);
                  resetGame();
                }}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span
              className={`text-sm font-medium ${
                strategy === "minimax" ? "text-red-500" : "text-gray-400"
              }`}
            >
              Hard
            </span>
          </div>

          <div className="flex flex-row space-x-6 items-center mr-8">
            <div className="flex flex-col items-center p-4 border border-gray-600 rounded-lg shadow-lg w-64 ms-5 bg-gradient-to-b from-gray-800 via-gray-900 to-black">
              <h2 className="text-xl font-bold text-gray-200">
                Top 5 Winners Today 🏆
              </h2>
              <div className="grid grid-cols-1 gap-6 mt-4">
                <div className="mb-4 w-full">
                  <div className="flex flex-col">
                    {isLoadingWinners ? (
                      <div className="flex justify-center items-center h-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                      </div>
                    ) : strategy === "greedy" && easyWinners.length > 0 ? (
                      easyWinners.slice(0, 5).map((winner, index) => (
                        <span
                          key={index}
                          className="text-sm font-semibold text-gray-500 mb-2"
                        >
                          {index + 1}. {winner.name} - {winner.wins} win
                          {winner.wins > 1 ? "s" : ""}
                        </span>
                      ))
                    ) : hardWinners.length > 0 ? (
                      hardWinners.slice(0, 5).map((winner, index) => (
                        <span
                          key={index}
                          className="text-sm font-semibold text-gray-500 mb-2"
                        >
                          {index + 1}. {winner.name} - {winner.wins} win
                          {winner.wins > 1 ? "s" : ""}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-semibold text-gray-500">
                        No winners yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex flex-col items-center space-y-6 p-2">
          <div className="grid grid-cols-5 gap-1 mt-6" data-testid="game-board">
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
              className="text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            >
              Restart Game
            </button>
{/*  font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2    */}
            <button
              onClick={handleUndo}
              disabled={!canUndo || history.length < 2 || winner !== null}
              className={`font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 ${
                !canUndo || history.length < 2 || winner
                  ? "bg-gray-400 cursor-not-allowed"
                  : "text-gray-600 bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-lime-300 dark:focus:ring-lime-800 shadow-lg shadow-lime-500/50 dark:shadow-lg dark:shadow-lime-800/80"
              } transition duration-300`}
            >
              Undo Last Move
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6 p-2">
          {/* Scoreboard */}
          <div className="flex flex-col items-center p-4 border border-gray-600 rounded-lg shadow-lg w-64 ms-5 bg-gradient-to-b from-gray-800 via-gray-900 to-black">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-2000">
                Game Scoreboard
              </h2>
            </div>

            <div className="mb-4 w-full">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Level</span>
                <span className="font-semibold text-gray-300">
                  {strategy === "greedy" ? "Easy" : "Hard"}
                </span>
              </div>
            </div>

            <div className="mb-4 w-full">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Player</span>
                <span className="font-semibold text-gray-300">
                  {playerName}
                </span>
              </div>
            </div>

            <div className="mb-4 w-full">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Player Wins</span>
                <span className="font-semibold text-green-400">
                  {playerWins}
                </span>
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
          <button
            className="text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            onClick={() => setShowHelp(true)}
          >
            Help
          </button>
        </div>
      </div>
    </div>
  );
}
