"use client";

import React, { Component } from "react";
import { PageHeader } from "@/shared/components/page-header";
import QueenIcon from "@/public/icons/queen.icon";

type Props = {};

type State = {
  board: number[][];
  queenCount: number;
  emptySlots: number;
  isModalOpen: boolean;
  gameMessage: string;
};

const BOARD_SIZE = 8;
const MOVES_LIMIT = 8;

export default class EightQueensPuzzle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const board = Array.from({ length: 8 }, () => Array(8).fill(0));
    const queenCount = 0;
    const emptySlots = BOARD_SIZE * BOARD_SIZE;
    this.state = {
      board,
      queenCount,
      emptySlots,
      isModalOpen: false,
      gameMessage: "",
    };
  }

  render() {
    return (
      <main className="container mx-auto px-4 py-8">
        <PageHeader
          title="Eight Queens Puzzle"
          description="Place 8 queens on a chessboard without threats"
        />

        <div className="flex justify-center mt-8">
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
                    disabled={cell === 1 || cell === 2}
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

            <div className="w-full">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Value:</span>
                <span className="font-semibold text-green-600">2</span>
              </div>
            </div>
          </div>
        </div>

        {this.state.isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {this.state.gameMessage}
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
  };

  handleRestart = () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(0));
    this.setState({
      board,
      queenCount: 0,
      emptySlots: BOARD_SIZE * BOARD_SIZE,
      isModalOpen: false,
    });
  };

  handleCancel = () => {
    this.setState({
      isModalOpen: false,
    });
  };
}
