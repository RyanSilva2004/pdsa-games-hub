"use client";

import React, { useContext, useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/page-header";
import QueenIcon from "@/public/icons/queen.icon";
import Image from "next/image";
import WinImage from "@/public/won.gif";
import LostImage from "@/public/over.gif";
import findAllNQueensSolutions from "./utils/eightQueensSolver";
import { CommonContext } from "@/context/Common";
import { createUser, createGuestUser } from "../../api/user";
import {
  addGeneratedSolution,
  deleteSolution,
  getAllSolutions,
  Solution,
} from "@/app/api/eightQueensPuzzle/EightQueensPuzzleService";

export enum solutionTypes {
  THREADED = "threaded",
  SEQUENTIAL = "sequential",
}
type ScoreEntry = {
  name: string;
  time: number;
  date: string;
};

type userGameSummary = {
  playerName: string;
  moves: number[][];
  timeTaken: string;
  result: "win" | "lose" | null;
};

const BOARD_SIZE = 8;
const MOVES_LIMIT = 8;

const EightQueensPuzzle = () => {
  const [playerName, setPlayerName] = useState<string>("");
  const [board, setBoard] = useState<number[][]>(
    Array.from({ length: 8 }, () => Array(8).fill(0))
  );
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>();
  const [queenCount, setQueenCount] = useState<number>(0);
  const { user } = useContext(CommonContext);
  const [emptySlots, setEmptySlots] = useState<number>(BOARD_SIZE * BOARD_SIZE);
  const [moves, setMoves] = useState<[][]>([]);
  const [timeTaken, setTimeTaken] = useState<string>("");
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameMessage, setGameMessage] = useState("");
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [highestScores, setHighestScores] = useState([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const [sequentialTime, setSequentialTime] = useState<number | null>(null);
  const [threadedTime, setThreadedTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUser = async () => {
    try {
      let userId;

      // if (userData.userType === 'registered') {
      //   userId = await createUser(userData);
      // } else if (userData.userType === 'guest') {
      userId = await createGuestUser();
      // } else {
      //   throw new Error('Invalid userType provided.');
      // }
    } catch (e) {
      console.log("error : ", e);
    }
  };

  useEffect(() => {
    setIsNameModalOpen(true);
  }, []);

  useEffect(() => {
    // handleUser();
  }, []);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleClick = (rowIndex: number, colIndex: number) => {
    const updatedBoard = findAllPossibleMoves(rowIndex, colIndex);

    let emptySlotCount = 0;
    updatedBoard.forEach((row) => {
      row.forEach((cell) => {
        if (cell === 0) emptySlotCount++;
      });
    });
    setBoard(updatedBoard);
    setQueenCount(queenCount + 1);

    if (queenCount === MOVES_LIMIT || emptySlotCount === 0) {
      gameOver(queenCount, emptySlotCount);
    }
  };

  const findAllPossibleMoves = (
    rowIndex: number,
    colIndex: number
  ): number[][] => {
    const newBoard = board.map((row) => [...row]);
    const boardSize = newBoard.length;

    for (let i = 0; i < boardSize; i++) {
      if (i !== rowIndex) newBoard[i][colIndex] = 2;
      if (i !== colIndex) newBoard[rowIndex][i] = 2;
    }

    for (let i = 1; i < boardSize; i++) {
      if (rowIndex + i < boardSize && colIndex + i < boardSize)
        newBoard[rowIndex + i][colIndex + i] = 2;
      if (rowIndex - i >= 0 && colIndex - i >= 0)
        newBoard[rowIndex - i][colIndex - i] = 2;
      if (rowIndex + i < boardSize && colIndex - i >= 0)
        newBoard[rowIndex + i][colIndex - i] = 2;
      if (rowIndex - i >= 0 && colIndex + i < boardSize)
        newBoard[rowIndex - i][colIndex + i] = 2;
    }

    newBoard[rowIndex][colIndex] = 1;
    return newBoard;
  };

  const countEmptySlots = () => {
    let emptySlotCount = 0;
    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell === 0) emptySlotCount++;
      });
    });
    return emptySlotCount;
  };

  const gameOver = (moves: number, emptySlotsCount: number) => {
    console.log("queenCount : ", queenCount);

    if (queenCount + 1 === BOARD_SIZE) {
      setIsModalOpen(true);
      setGameMessage("You won!");
    } else {
      setIsModalOpen(true);
      setGameMessage("Game over! You are out of moves.");
    }

    updateUserGameHistory({
      playerName,
      board,
      elapsedTime,
      gameMessage,
    });

    if (timerInterval) clearInterval(timerInterval);
  };

  const handleRestart = () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(0));
    setBoard(board);
    setQueenCount(0);
    setEmptySlots(BOARD_SIZE * BOARD_SIZE);
    setIsModalOpen(false);
    setIsGameStarted(false);
    setStartTime(null);
    setElapsedTime(0);
    if (timerInterval) clearInterval(timerInterval);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleStartGame = () => {
    setIsGameStarted(true);
    const start = Date.now();
    setStartTime(start);

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    setTimerInterval(interval);
  };

  const updateUserGameHistory = (data: userGameSummary) => {};

  const sendGameDataToServer = async () => {
    const gameData: userGameSummary = {
      playerName,
      moves: board,
      timeTaken: elapsedTime.toString(),
      result: gameMessage.includes("won") ? "win" : "lose",
    };

    try {
      await fetch("/api/save-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameData),
      });
    } catch (error) {
      console.error("Error saving game data:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  const getFilteredSolutions = async (
    type: string
  ): Promise<Solution | undefined> => {
    const existingSolutions = await getAllSolutions();
    return existingSolutions.find((item: Solution) => item.method === type);
  };

  const runWorkerAndSaveSolution = () => {
    return new Promise<void>((resolve, reject) => {
      const worker = new Worker(
        new URL("./utils/workerThread", import.meta.url)
      );
      const n = Array(BOARD_SIZE).fill(-1).length;

      const threadStart = performance.now();

      worker.postMessage({ n });

      worker.onmessage = async (e) => {
        const workerResults: number[][] = e.data;

        const threadEnd = performance.now();
        const timeTaken = threadEnd - threadStart;

        if (workerResults.length === 0) {
          reject("No results returned from worker.");
          worker.terminate();
          return;
        }

        const solutionStrings = workerResults.map((solution) =>
          solution.join(",")
        );
        console.log("Worker results:", solutionStrings);

        const existingSolutions = await getFilteredSolutions(
          solutionTypes.THREADED
        );

        if (existingSolutions && existingSolutions.timeTaken > timeTaken) {
          setSequentialTime(timeTaken);
          await deleteSolution(existingSolutions.id);
        } else if (
          existingSolutions &&
          existingSolutions.timeTaken < timeTaken
        ) {
          setSequentialTime(existingSolutions.timeTaken);
          return;
        }

        try {
          await addGeneratedSolution(
            solutionStrings,
            solutionTypes.THREADED,
            timeTaken
          );
          console.log(`threaded solution saved to Firestore.`);
          resolve();
        } catch (error) {
          console.error(`Error saving threaded solution:`, error);
          reject(error);
        } finally {
          worker.terminate();
        }
      };

      worker.onerror = (error) => {
        console.error("Worker encountered an error:", error);
        reject(error);
        worker.terminate();
      };
    });
  };

  const storeSolutionsIfNew = async () => {
    const backtrackingStart = performance.now();
    const backtrackingResults = findAllNQueensSolutions(BOARD_SIZE);
    const backtrackingEnd = performance.now();
    const backtrackingTime = backtrackingEnd - backtrackingStart;
    let latestTimeTaken;
    let existingSolutions;
    try {
      existingSolutions = await getFilteredSolutions(solutionTypes.SEQUENTIAL);

      const stringifiedResults = backtrackingResults.results.map((solution) =>
        solution.join(",")
      );

      if (
        !existingSolutions ||
        existingSolutions.timeTaken > backtrackingTime
      ) {
        latestTimeTaken = backtrackingTime;
        await addGeneratedSolution(
          stringifiedResults,
          solutionTypes.SEQUENTIAL,
          backtrackingTime
        );
      } else {
        latestTimeTaken = existingSolutions.timeTaken;
      }
    } catch (error) {
      console.error("Error saving backtracking solution:", error);
    } finally {
    }

    if (existingSolutions && existingSolutions.timeTaken > backtrackingTime) {
      await deleteSolution(existingSolutions.id);
    }

    setThreadedTime(latestTimeTaken || null);
  };

  const automationCalls = async () => {
    try {
      setIsLoading(true);
      storeSolutionsIfNew();
      runWorkerAndSaveSolution();
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    automationCalls();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader
        title="Eight Queens Puzzle"
        description="Place 8 queens on a chessboard without threats"
      />
      <div className="flex justify-center items-center mb-8">
        <span className="text-lg font-semibold text-gray-700 me-4">
          Time: {formatTime(elapsedTime)}
        </span>
        {!isGameStarted && (
          <button
            onClick={handleStartGame}
            className="w-32 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Game
          </button>
        )}
      </div>

      <div className="flex justify-end text-gray-700">
        <span>Sequential: </span>
        <span className="font-medium text-blue-600">
          {sequentialTime?.toFixed(4)}
        </span>
      </div>
      <div className="flex justify-end text-gray-700">
        <span>Threaded: </span>
        <span className="font-medium text-green-600">
          {threadedTime?.toFixed(4)}
        </span>
      </div>

      <div className="flex justify-center mt-8">
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg w-40 me-5 h-fit">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Toolbar</h2>

          <button
            onClick={handleRestart}
            className="w-full mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!isGameStarted}
          >
            Reset
          </button>

          <button
            onClick={() => {
              setIsHelpModalOpen(true);
            }}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Help
          </button>
          <button
            onClick={() => {
              console.log("clicked hint");
            }}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 mt-2"
          >
            Hint
          </button>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              let buttonColor = "bg-gray-200";
              if (cell === 1) {
                buttonColor = "bg-[#03c300]";
              } else if (cell === 2) {
                buttonColor = "bg-[#bff3c4]";
              }

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-16 h-16 ${buttonColor} hover:bg-opacity-80 rounded-lg flex items-center justify-center`}
                  onClick={() => handleClick(rowIndex, colIndex)}
                  disabled={!isGameStarted || cell === 1 || cell === 2}
                >
                  {cell === 1 ? <QueenIcon size={25} color="#ffffff" /> : null}
                </button>
              );
            })
          )}
        </div>
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg w-64 ms-5">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Game Scoreboard</h2>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Remaining Moves:</span>
              <span className="font-semibold text-blue-600">
                {MOVES_LIMIT - queenCount}
              </span>
            </div>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Empty Slots:</span>
              <span className="font-semibold text-red-600">
                {countEmptySlots()}
              </span>
            </div>
          </div>

          <div className="w-full mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Value:</span>
              <span className="font-semibold text-green-600">2</span>
            </div>
          </div>

          <div className="w-full border-t pt-4 mt-2">
            <h3 className="text-md font-semibold text-gray-700 mb-2">
              Top 10 Scores
            </h3>
            {highestScores && highestScores.length > 0 ? (
              <div className="space-y-2">
                {highestScores
                  .slice(0, 10)
                  .map((score: ScoreEntry, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm text-gray-700"
                    >
                      <span className="w-1/3 truncate">{score.name}</span>
                      <span className="w-1/3 text-center">{score.time}s</span>
                      <span className="w-1/3 text-right">{score.date}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No scores recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {isNameModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Enter Your Name
            </h3>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 mb-4 border rounded"
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              onClick={() => setIsNameModalOpen(false)}
              disabled={playerName.trim() === ""}
            >
              Start
            </button>
          </div>
        </div>
      )}

      {isHelpModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              How to Play
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-left">
              The objective of the Eight Queens Puzzle is to place eight queens
              on a standard 8×8 chessboard so that no two queens threaten each
              other.
              <br />
              <br />
              A queen can move any number of squares vertically, horizontally,
              or diagonally.
              <br />
              <br />
              Your task is to place each queen on the board so that none of them
              share the same row, column, or diagonal.
              <br />
              <br />
              You win when all 8 queens are placed without conflict.
            </p>
            <button
              onClick={() => {
                setIsHelpModalOpen(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
            {gameMessage === "You won!" && (
              <div className="mb-4 flex justify-center">
                <Image
                  src={WinImage}
                  alt="You Won"
                  width={100}
                  height={100}
                  className="mx-auto"
                />
              </div>
            )}
            {gameMessage === "Game over! You are out of moves." && (
              <div className="mb-4 flex justify-center">
                <Image
                  src={LostImage}
                  alt="You Won"
                  width={100}
                  height={100}
                  className="mx-auto"
                />
              </div>
            )}
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {gameMessage} - Time: {formatTime(elapsedTime)}
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-green-500 text-white rounded-md"
              >
                Restart
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default EightQueensPuzzle;
