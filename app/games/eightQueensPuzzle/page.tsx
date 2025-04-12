"use client";

import React, { Component } from "react";
import { PageHeader } from "@/shared/components/page-header";
import QueenIcon from "@/public/icons/queen.icon";
import Image from "next/image";
import WinImage from "@/public/won.gif";
import LostImage from "@/public/over.gif";
import axios from "axios";
import { API_URL } from "@/app/config";

type Props = {};

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

type State = {
  board: number[][];
  queenCount: number;
  emptySlots: number;
  isModalOpen: boolean;
  gameMessage: string;
  isGameStarted: boolean;
  startTime: number | null;
  elapsedTime: number;
  isHelpModalOpen: boolean;
  highestScores: ScoreEntry[];
  playerName: string;
  isNameModalOpen: boolean;
  gameHistory: userGameSummary;
  testMessage: string;
};

const BOARD_SIZE = 8;
const MOVES_LIMIT = 8;

export default class EightQueensPuzzle extends Component<Props, State> {
  timerInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    const board = Array.from({ length: 8 }, () => Array(8).fill(0));

    const gameHistory = {
      playerName: "",
      moves: board,
      timeTaken: "",
      result: null,
    };
    this.state = {
      board,
      queenCount: 0,
      emptySlots: BOARD_SIZE * BOARD_SIZE,
      isModalOpen: false,
      gameMessage: "",
      isGameStarted: false,
      startTime: null,
      elapsedTime: 0,
      isHelpModalOpen: false,
      highestScores: [],
      playerName: "",
      isNameModalOpen: true,
      gameHistory,
      testMessage: "",
    };
  }

  componentDidMount() {
    axios
      .get(`${API_URL}/`)
      .then((response) => {
        this.setState({ testMessage: response.data.message });
      })
      .catch((error) => {
        console.error("Error fetching test message:", error);
      });
  }

  render() {
    return (
      <main className="container mx-auto px-4 py-8">
        <PageHeader
          title="Eight Queens Puzzle"
          description="Place 8 queens on a chessboard without threats"
        />
        <div className="flex justify-center items-center mb-8">
          <span className="text-lg font-semibold text-gray-700 me-4">
            Time: {this.formatTime(this.state.elapsedTime)}
          </span>
          {!this.state.isGameStarted && (
            <button
              onClick={this.handleStartGame}
              className="w-32 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start Game
            </button>
          )}
        </div>

        <div className="flex justify-center mt-8">
          <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg w-40 me-5 h-fit">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Toolbar
            </h2>

            <button
              onClick={this.handleRestart}
              className="w-full mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!this.state.isGameStarted}
            >
              Reset
            </button>

            <button
              onClick={() => this.setState({ isHelpModalOpen: true })}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Help
            </button>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {this.state.board.map((row, rowIndex) =>
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
                    onClick={() => this.handleClick(rowIndex, colIndex)}
                    disabled={
                      !this.state.isGameStarted || cell === 1 || cell === 2
                    }
                  >
                    {cell === 1 ? (
                      <QueenIcon size={25} color="#ffffff" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg w-64 ms-5">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Game Scoreboard
              </h2>
            </div>

            <div className="mb-4 w-full">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining Moves:</span>
                <span className="font-semibold text-blue-600">
                  {MOVES_LIMIT - this.state.queenCount}
                </span>
              </div>
            </div>

            <div className="mb-4 w-full">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Total Empty Slots:
                </span>
                <span className="font-semibold text-red-600">
                  {this.countEmptySlots()}
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
              {this.state.highestScores &&
              this.state.highestScores.length > 0 ? (
                <div className="space-y-2">
                  {this.state.highestScores.slice(0, 10).map((score, index) => (
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

        {this.state.isNameModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Enter Your Name
              </h3>
              <input
                type="text"
                value={this.state.playerName}
                onChange={(e) => this.setState({ playerName: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-2 mb-4 border rounded"
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                onClick={() => this.setState({ isNameModalOpen: false })}
                disabled={this.state.playerName.trim() === ""}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {this.state.isHelpModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                How to Play
              </h3>
              <p className="text-sm text-gray-600 mb-6 text-left">
                The objective of the Eight Queens Puzzle is to place eight
                queens on a standard 8×8 chessboard so that no two queens
                threaten each other.
                <br />
                <br />
                A queen can move any number of squares vertically, horizontally,
                or diagonally.
                <br />
                <br />
                Your task is to place each queen on the board so that none of
                them share the same row, column, or diagonal.
                <br />
                <br />
                You win when all 8 queens are placed without conflict.
              </p>
              <button
                onClick={() => this.setState({ isHelpModalOpen: false })}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {this.state.isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
              {this.state.gameMessage === "You won!" && (
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
              {this.state.gameMessage ===
                "Game over! You are out of moves." && (
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
                {this.state.gameMessage} - Time:{" "}
                {this.formatTime(this.state.elapsedTime)}
              </h3>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={this.handleRestart}
                  className="px-4 py-2 bg-green-500 text-white rounded-md"
                >
                  Restart
                </button>
                <button
                  onClick={this.handleCancel}
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
  }

  formatTime(timeInSeconds: number) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  handleClick(rowIndex: number, colIndex: number) {
    const updatedBoard = this.findAllPossibleMoves(rowIndex, colIndex);

    let emptySlotCount = 0;
    updatedBoard.forEach((row) => {
      row.forEach((cell) => {
        if (cell === 0) emptySlotCount++;
      });
    });

    this.setState(
      (prev) => ({
        board: updatedBoard,
        queenCount: prev.queenCount + 1,
      }),
      () => {
        if (this.state.queenCount === MOVES_LIMIT || emptySlotCount === 0) {
          this.gameOver(this.state.queenCount, emptySlotCount);
        }
      }
    );
  }

  findAllPossibleMoves(rowIndex: number, colIndex: number): number[][] {
    const newBoard = this.state.board.map((row) => [...row]);
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
  }

  countEmptySlots = () => {
    let emptySlotCount = 0;
    this.state.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell === 0) emptySlotCount++;
      });
    });
    return emptySlotCount;
  };

  gameOver = (moves: number, emptySlotsCount: number) => {
    console.log("game over");

    if (this.state.queenCount === BOARD_SIZE) {
      this.setState({
        isModalOpen: true,
        gameMessage: "You won!",
      });
    } else {
      this.setState({
        isModalOpen: true,
        gameMessage: "Game over! You are out of moves.",
      });
    }

    this.updateUserGameHistory({
      playerName: this.state.playerName,
      moves: this.state.board,
      timeTaken: this.state.elapsedTime.toString(),
      result: this.state.gameMessage.includes("won") ? "win" : "lose",
    });

    if (this.timerInterval) clearInterval(this.timerInterval);
  };

  handleRestart = () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(0));
    this.setState({
      board,
      queenCount: 0,
      emptySlots: BOARD_SIZE * BOARD_SIZE,
      isModalOpen: false,
      isGameStarted: false,
      startTime: null,
      elapsedTime: 0,
    });
    if (this.timerInterval) clearInterval(this.timerInterval);
  };

  handleCancel = () => {
    this.setState({
      isModalOpen: false,
    });
  };

  handleStartGame = () => {
    this.setState({
      isGameStarted: true,
      startTime: Date.now(),
    });

    this.timerInterval = setInterval(() => {
      this.setState((prevState) => ({
        elapsedTime: Math.floor(
          (Date.now() - (prevState.startTime ?? 0)) / 1000
        ),
      }));
    }, 1000);
  };

  updateUserGameHistory = (data: userGameSummary) => {
    console.log("game history data : ", data);
  };

  sendGameDataToServer = async () => {
    if (this.state.gameHistory) {
      await fetch("/api/save-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.state.gameHistory),
      });
    }
  };
}
