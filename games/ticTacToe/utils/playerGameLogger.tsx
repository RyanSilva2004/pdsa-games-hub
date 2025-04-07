import { checkWinner } from "../logic/gameLogic";

type GameResult = {
  winner: "X" | "O";
  board: string[][];
  playerMoves: [number, number][];
  timestamp: string;
  playerName: string; 
  strategy: "greedy" | "minimax";
};

export const getGameResultIfPlayerWins = (
  board: string[][],
  moveHistory: string[][][],
  playerName: string,
  strategy: "greedy" | "minimax"
): GameResult | null => {
  const winner = checkWinner(board);

  if (winner === "X") {
    const playerMoves: [number, number][] = [];

    for (let b = 1; b < moveHistory.length; b++) {
      const prev = moveHistory[b - 1];
      const curr = moveHistory[b];

      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (prev[i][j] !== curr[i][j] && curr[i][j] === "X") {
            playerMoves.push([i, j]);
          }
        }
      }
    }

    return {
      winner,
      board,
      playerMoves,
      timestamp: new Date().toISOString(),
      playerName,
      strategy
    };
  }

  return null;
};
