"use client";

import React, { Component } from "react";
import { PageHeader } from "@/shared/components/page-header";
import QueenIcon from "@/public/icons/queen.icon";

type Props = {};

type State = {
  board: number[][];
};

export default class EightQueensPuzzle extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const board = Array.from({ length: 8 }, () => Array(8).fill(0));
    this.state = {
      board,
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
        </div>
      </main>
    );
  }

  handleClick(rowIndex: number, colIndex: number) {
    this.findAllPossibleMoves(rowIndex, colIndex);
    const newBoard = [...this.state.board];
    newBoard[rowIndex][colIndex] = newBoard[rowIndex][colIndex] === 0 ? 1 : 0;
    this.setState({ board: newBoard });
  }

  findAllPossibleMoves(rowIndex: number, colIndex: number) {
    console.log("rowIndex : ", rowIndex);
    console.log("colIndex : ", colIndex);
    const newBoard = [...this.state.board];
    const boardSize = newBoard.length;

    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (newBoard[i][j] !== 1) {
          newBoard[i][j] = 0;
        }
      }
    }
    console.log("newBoard : ", newBoard);
    for (let i = 0; i < boardSize; i++) {
      if (i !== rowIndex) {
        newBoard[i][colIndex] = 2;
      }
      if (i !== colIndex) {
        newBoard[rowIndex][i] = 2;
      }
    }

    for (let i = 1; i < boardSize; i++) {
      if (rowIndex + i < boardSize && colIndex + i < boardSize) {
        newBoard[rowIndex + i][colIndex + i] = 2;
      }
      if (rowIndex - i >= 0 && colIndex - i >= 0) {
        newBoard[rowIndex - i][colIndex - i] = 2;
      }
      if (rowIndex + i < boardSize && colIndex - i >= 0) {
        newBoard[rowIndex + i][colIndex - i] = 2;
      }
      console.log("colIndex - i : ", colIndex - i);
      if (rowIndex - i >= 0 && colIndex + i < boardSize) {
        newBoard[rowIndex - i][colIndex + i] = 2;
      }
    }

    this.setState({ board: newBoard });
  }
}
