import { checkWinner } from "../logic/gameLogic";

type GameResult = {
  playerName: string;
  winner: string;
  board: string[][];
  strategy: "greedy" | "minimax";
  startTime: string;
  endTime: string;
  computerMoveDurations: number[]; 
};

export const buildGameResult = (
  board: string[][],
  strategy: "greedy" | "minimax",
  playerName: string,
  startTime: Date,
  endTime: Date,
  computerMoveDurations: number[]
): GameResult => {
  const rawWinner = checkWinner(board);

  let winner: string;
  if (rawWinner === "X") {
    winner = "X - " + playerName;
  } else if (rawWinner === "O") {
    winner = "O - Computer";
  } else if (!rawWinner && board.flat().every((cell) => cell !== null)) {
    winner = "Draw";
  } else {
    winner = ""; 
  }

  return {
    playerName,
    winner,
    board,
    strategy,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    computerMoveDurations,
  };
};
