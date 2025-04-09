import { findBestMoveMinimax } from "./minimax";
import { findBestMoveGreedy } from "./greedy";

export const BOARD_SIZE = 5;

export const emptyBoard = (): string[][] => {
  let board: string[][] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    let row: string[] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
};

export const handleMove = (
  board: string[][],
  history: string[][][],
  row: number,
  col: number,
  player: string
) => {
  let newBoard = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    newBoard.push([...board[i]]);
  }

  newBoard[row][col] = player;
  history.push(newBoard);

  return { newBoard, newHistory: history };
};

export const handleUndoMove = (history: string[][][]) => {
  if (history.length === 0) {
    return { newBoard: emptyBoard(), newHistory: [], undoAvailable: false };
  }
  if (history.length < 2) {
    return { newBoard: history[0], newHistory: history, undoAvailable: false };
  }

  const newHistory = history.slice(0, -2);
  const newBoard =
    newHistory.length > 0 ? newHistory[newHistory.length - 1] : emptyBoard();

  return { newBoard, newHistory, undoAvailable: false };
};

export const checkWinner = (board: string[][]): string | null => {
  // check rows
  for (let i = 0; i < BOARD_SIZE; i++) {
    let row = board[i];
    if (row[0] && row.every((cell) => cell === row[0])) {
      return row[0];
    }
  }

  // check columns
  for (let i = 0; i < BOARD_SIZE; i++) {
    let col = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      col.push(board[j][i]);
    }
    if (col[0] && col.every((cell) => cell === col[0])) {
      return col[0];
    }
  }

  // check diagonals
  let mainDiagonal = [];
  let antiDiagonal = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    mainDiagonal.push(board[i][i]);
    antiDiagonal.push(board[i][BOARD_SIZE - 1 - i]);
  }

  if (
    mainDiagonal[0] &&
    mainDiagonal.every((cell) => cell === mainDiagonal[0])
  ) {
    return mainDiagonal[0];
  }
  if (
    antiDiagonal[0] &&
    antiDiagonal.every((cell) => cell === antiDiagonal[0])
  ) {
    return antiDiagonal[0];
  }

  return null;
};

export const handleComputerMove = (
    board: string[][],
    history: string[][][],
    strategy: "minimax" | "greedy" = "minimax"
  ) => {
    let move: [number, number];
  
    if (strategy === "minimax") {
      move = findBestMoveMinimax(board);
    } else {
      move = findBestMoveGreedy(board);
    }
  
    const [r, c] = move;
    return handleMove(board, history, r, c, "O");
  };