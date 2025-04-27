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
  getAllWinningMoves,
  moveWinnerToOldAndReset,
  saveGamePlay,
  Solution,
} from "@/app/api/eightQueensPuzzle/EightQueensPuzzleService";
import {
  gameStatusType,
  SolutionRecognition,
  solutionTypes,
} from "@/app/types/gameEnums";
import { userType } from "@/app/types/userEnums";
import getHintFromSolutions from "./utils/hintFromSolutions";
import { headers } from "next/headers";

type errorType = {
  header: string;
  description: any;
};

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

export const checkAndResetScoreboard = async (
  highestScores: any[],
  getFilteredSolutions: (type: solutionTypes) => Promise<any>,
  moveWinnerToOldAndReset: () => Promise<void>
) => {
  const allSolutions = await getFilteredSolutions(solutionTypes.SEQUENTIAL);

  const validSolutions = (allSolutions?.solution || []).map((str: any) =>
    str.split(",").slice(0, -1).join(",")
  );

  const allUserSolutions = highestScores.filter((sol) => sol.status === "win");

  const trimmedUserSolutions = allUserSolutions
    .map((sol) => {
      if (!sol.moves || !Array.isArray(sol.moves)) return null;
      const trimmed = sol.moves.slice(0, -1);
      return trimmed.join(",");
    })
    .filter(Boolean);

  const matchedCount = trimmedUserSolutions.filter((userSol) =>
    validSolutions.includes(userSol)
  ).length;

  const allMatched = matchedCount === validSolutions.length;

  if (allMatched) {
    await moveWinnerToOldAndReset();
    console.log("Game reset. Winners moved to old collection.");
    return true;
  }

  return false;
};

export const handleGamePlay = async (
  finalMoves: string[],
  solutionType: SolutionRecognition,
  gameStatus: gameStatusType,
  playerName: string,
  elapsedTime: number
) => {
  try {
    const userId = await saveGamePlay(
      playerName,
      finalMoves,
      solutionTypes.GAME_PLAY,
      elapsedTime,
      gameStatus,
      userType.GUEST_USER,
      solutionType
    );
  } catch (e) {
    throw { header: "Error in save Game", description: e };
  } finally {
  }
};

export const fetchScores = async () => {
  try {
    const allScores = await getAllWinningMoves();

    const sortedTopWinners = allScores
      .filter((score) => score.status === "win")
      .sort((a, b) => a.time - b.time);
    console.log("sortedTopWinners  : ", sortedTopWinners);
    return sortedTopWinners;
  } catch (e) {
    throw { header: "Error in Fetching Score Board", description: e };
  }
};

export const gameOver = async (
  queenCount: number,
  playerName: string,
  elapsedTime: number,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setGameMessage: React.Dispatch<React.SetStateAction<string>>,
  setIsGameEndingLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<errorType | null>>,
  filteredMovesOfUser: () => string[],
  isSolutionValidate: () => Promise<boolean | null>,
  handleGamePlay: (
    moves: string[],
    solutionRecognition: SolutionRecognition,
    gameStatus: gameStatusType,
    playerName: string,
    elapsedTime: number
  ) => Promise<void>,
  countEmptySlots: () => number,
  timerInterval: NodeJS.Timeout | null | undefined
) => {
  setIsGameEndingLoading(true);
  const finalMoves = filteredMovesOfUser();

  if (queenCount + 1 === BOARD_SIZE) {
    const isKnownSolution = await isSolutionValidate();

    setIsModalOpen(true);
    if (isKnownSolution == null) {
      setGameMessage(
        "You have successfully solved the puzzle. However, an issue occurred during the game-winning validation. Please reload the page to see your name appear on the leaderboard."
      );
    } else {
      setGameMessage(
        isKnownSolution ? "This solution already exists!" : "You won!"
      );
    }

    try {
      await handleGamePlay(
        finalMoves,
        isKnownSolution
          ? SolutionRecognition.Known
          : SolutionRecognition.Unique,
        gameStatusType.WIN,
        playerName,
        elapsedTime
      );
    } catch (e) {
      setError({ header: "Error in save Game", description: e });
    }
  } else {
    try {
      await handleGamePlay(
        finalMoves,
        SolutionRecognition.Variation,
        gameStatusType.LOST,
        playerName,
        elapsedTime
      );
    } catch (e) {
      setError({ header: "Error in save Game", description: e });
    }

    setIsModalOpen(true);
    const emptySlots = countEmptySlots();

    if (emptySlots === 1) {
      setGameMessage("Game over! So close! Only one move left.");
    } else if (emptySlots > 0) {
      setGameMessage("Game over! You are out of moves.");
    }
  }
  setIsGameEndingLoading(false);
  if (timerInterval) clearInterval(timerInterval);
};

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
  const [highestScores, setHighestScores] = useState<ScoreEntry[]>([]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [error, setError] = useState<errorType | null>(null);
  const [sequentialTime, setSequentialTime] = useState<number | null>(null);
  const [threadedTime, setThreadedTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScoreBoardLoading, setIsScoreBoardloading] = useState(true);
  const [isGameEndingLoading, setIsGameEndingLoading] = useState(false);
  const [allBacktrackSolutions, setAllBacktrackSolutions] = useState<
    string[] | undefined
  >([]);

  const [currentHint, setCurrentHint] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [hintCount, setHintCount] = useState(2);
  const [hintVislbe, setHintVislbe] = useState(true);

  useEffect(() => {
    setIsNameModalOpen(true);
  }, []);

  const fetchingScore = async () => {
    try {
      setIsScoreBoardloading(true);
      const scoreDataSet = await fetchScores();
      setHighestScores(scoreDataSet);
    } catch (e) {
      setError({ header: "Error in Fetching Score Board", description: e });
    } finally {
      setIsScoreBoardloading(false);
    }
  };

  useEffect(() => {
    fetchingScore();
  }, [isGameEndingLoading]);

  const resertScoreCaller = async () => {
    await checkAndResetScoreboard(
      highestScores,
      () => getFilteredSolutions(solutionTypes.SEQUENTIAL),
      moveWinnerToOldAndReset
    );
  };

  useEffect(() => {
    resertScoreCaller();
  }, [highestScores, sequentialTime]);

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
      gameOver(
        queenCount,
        playerName,
        elapsedTime,
        setIsModalOpen,
        setGameMessage,
        setIsGameEndingLoading,
        setError,
        filteredMovesOfUser,
        isSolutionValidate,
        handleGamePlay,
        countEmptySlots,
        timerInterval
      );
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

  const filteredMovesOfUser = () => {
    let finalMoves: number[] = [];
    finalMoves = board.map((row) => row.indexOf(1));

    const finalMovesStr: string[] = finalMoves.map(String);

    return finalMovesStr;
  };

  const isSolutionValidate = async (): Promise<boolean | null> => {
    let allWinningMoves;
    try {
      allWinningMoves = await getAllWinningMoves();
    } catch (e) {
      setError({ header: "Error in Solution Validation", description: e });
    }
    const userMoves = filteredMovesOfUser();

    const currentStr = JSON.stringify(userMoves);
    if (allWinningMoves) {
      return allWinningMoves.some(
        (entry: any) => JSON.stringify(entry.moves) === currentStr
      );
    } else {
      return null;
    }
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
    setHintCount(2);
    setHintVislbe(false);
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

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  const getFilteredSolutions = async (
    type: string
  ): Promise<Solution | undefined> => {
    try {
      const existingSolutions = await getAllSolutions();
      return existingSolutions.find((item: Solution) => item.method === type);
    } catch (e) {
      setError({ header: "error in filter solution", description: e });
    }
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

  const initialData = async () => {
    let existingSolutions = await getFilteredSolutions(
      solutionTypes.SEQUENTIAL
    );
    setAllBacktrackSolutions(existingSolutions?.solution);
  };

  useEffect(() => {
    initialData();
  }, []);

  const getTheHint = async () => {
    setHintVislbe(true);
    if (hintCount > 0) {
      setHintCount((pre) => pre - 1);
      if (allBacktrackSolutions) {
        const hint = getHintFromSolutions(
          filteredMovesOfUser(),
          allBacktrackSolutions
        );
        setCurrentHint(hint);
      }
    }
  };

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
            className="text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
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
      {error && (
        <div className="fixed bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md">
          <div
            id="alert-border-2"
            className=" flex items-center p-4 mb-4 text-red-800 border-t-4 border-red-300 bg-red-50 dark:text-red-400 dark:bg-gray-800 dark:border-red-800"
            role="alert"
          >
            <svg
              className="shrink-0 w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <div className="ms-3 text-sm font-medium">
              {error.header}
              <p className="font-semibold hover:no-underline">
                {error.description}
              </p>
            </div>
            <button
              type="button"
              className="ms-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700"
              data-dismiss-target="#alert-border-2"
              aria-label="Close"
              onClick={() => setError(null)}
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="flex justify-center mt-8">
        <div className="flex flex-col items-center p-4 border border-gray-600 rounded-lg shadow-lg w-40 me-5 h-fit bg-gradient-to-b from-gray-800 via-gray-900 to-black">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Toolbar</h2>

          <button
            onClick={handleRestart}
            className="text-white bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            disabled={!isGameStarted}
          >
            Reset
          </button>

          <button
            onClick={() => {
              setIsHelpModalOpen(true);
            }}
            className="text-white bg-gradient-to-r from-lime-200 via-lime-400 to-lime-500 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-lime-300 dark:focus:ring-lime-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
          >
            Help
          </button>

          <button
            onClick={() => {
              getTheHint();
            }}
            className="text-white bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
            disabled={hintCount === 0 || !isGameStarted}
          >
            Hint <br />
            <span className="text-white text-xs">
              {hintCount > 0
                ? `(${hintCount} remaining)`
                : `(no hints are remaining)`}
            </span>
          </button>
        </div>
        {isGameEndingLoading ? (
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }).map((_, rowIndex) =>
              Array.from({ length: 8 }).map((_, colIndex) => (
                <div
                  key={`loader-${rowIndex}-${colIndex}`}
                  className="w-16 h-16 bg-gray-300 rounded-lg animate-pulse"
                ></div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-2 p-4 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-inner">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                let buttonStyle =
                  "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800";
                let queen = null;

                if (cell === 1) {
                  buttonStyle =
                    "bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-lg";
                  queen = <QueenIcon size={25} color="#ffffff" />;
                } else if (cell === 2) {
                  buttonStyle =
                    "bg-gradient-to-br from-green-100 via-green-200 to-green-300 text-green-800";
                }

                const isHint =
                  currentHint?.row === rowIndex &&
                  currentHint?.col === colIndex;

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-16 h-16 ${buttonStyle} rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105
            ${
              isHint && hintVislbe ? "animate-blink ring-4 ring-yellow-400" : ""
            }
          `}
                    onClick={() => {
                      handleClick(rowIndex, colIndex), setHintVislbe(true);
                    }}
                    disabled={!isGameStarted || cell === 1 || cell === 2}
                  >
                    {queen}
                  </button>
                );
              })
            )}
          </div>
        )}
        <div className="flex flex-col items-center p-4 border border-gray-600 rounded-lg shadow-lg w-80 ms-5 bg-gradient-to-b from-gray-800 via-gray-900 to-black">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-200">Game Scoreboard</h2>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Remaining Moves:</span>
              <span className="font-semibold text-blue-400">
                {MOVES_LIMIT - queenCount}
              </span>
            </div>
          </div>

          <div className="mb-4 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Total Empty Slots:</span>
              <span className="font-semibold text-red-400">
                {countEmptySlots()}
              </span>
            </div>
          </div>

          <div className="w-full border-t border-gray-700 pt-4 mt-2">
            {isScoreBoardLoading ? (
              <div
                role="status"
                className="max-w-md p-4 space-y-4 border border-gray-600 divide-y divide-gray-700 rounded-sm shadow-sm animate-pulse"
              >
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between pt-4"
                  >
                    <div>
                      <div className="h-2.5 bg-gray-600 rounded-full w-24 mb-2.5"></div>
                      <div className="w-32 h-2 bg-gray-700 rounded-full"></div>
                    </div>
                    <div className="h-2.5 bg-gray-700 rounded-full w-12"></div>
                  </div>
                ))}
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <>
                <h3 className="text-md font-semibold text-gray-200 mb-2">
                  Top Scores
                </h3>
                {highestScores && highestScores.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-auto">
                    {highestScores.map((score: ScoreEntry, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm text-gray-300"
                      >
                        <span className="w-1/3 truncate">{score.name}</span>
                        <span className="w-1/3 text-center">{score.time}s</span>
                        <span className="w-1/3 text-right">{score.date}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isScoreBoardLoading &&
                  highestScores &&
                  !highestScores.length && (
                    <div className="text-sm text-gray-400 italic">
                      No scores recorded yet
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 via-gray-900/80 to-black/70 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-5">
              Enter Your Name
            </h3>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3 mb-4 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
            <button
              className={
                playerName.trim() !== ""
                  ? "w-full text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-3 transition-all shadow"
                  : "w-full text-gray-400 bg-gray-200 cursor-not-allowed font-medium rounded-lg text-sm px-5 py-3 opacity-70"
              }
              onClick={() => setIsNameModalOpen(false)}
              disabled={playerName.trim() === ""}
            >
              Save
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/70 via-gray-900/80 to-black/70 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center">
            {(gameMessage === "You won!" ||
              gameMessage === "Game over! You are out of moves.") && (
              <div className="mb-4 flex justify-center">
                <Image
                  src={gameMessage === "You won!" ? WinImage : LostImage}
                  alt={gameMessage === "You won!" ? "You Won" : "Game Over"}
                  width={120}
                  height={120}
                  className="mx-auto rounded-lg shadow-md object-contain"
                />
              </div>
            )}
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              {gameMessage}{" "}
              <span className="block text-sm text-gray-500 dark:text-gray-300">
                Time: {formatTime(elapsedTime)}
              </span>
            </h3>
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow transition"
              >
                Restart
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition"
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
