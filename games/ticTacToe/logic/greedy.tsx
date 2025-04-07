import { BOARD_SIZE } from "@/games/ticTacToe/logic/gameLogic";

export const findBestMoveGreedy = (board: string[][]): [number, number] => {
  let bestScore = -1;
  let bestMove: [number, number] = [-1, -1];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col]) {
        const blockScore = countNearbyOs(board, row, col, "X");

        const scoreForO = countNearbyOs(board, row, col, "O");

        // block X
        const totalScore = blockScore * 2 - scoreForO;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMove = [row, col];
        }
      }
    }
  }

  return bestMove;
};

const countNearbyOs = (
  board: string[][],
  row: number,
  col: number,
  player: string
): number => {
  let count = 0;

  // all 8 directions
  const directions = [
    [0, 1], // right
    [1, 0], // down
    [1, 1], // down-right
    [1, -1], // down-left
    [0, -1], // left
    [-1, 0], // up
    [-1, -1], // up-left
    [-1, 1], // up-right
  ];

  for (let i = 0; i < directions.length; i++) {
    const direction = directions[i];
    const nextRow = row + direction[0];
    const nextCol = col + direction[1];

    const isInsideBoard =
      nextRow >= 0 &&
      nextRow < BOARD_SIZE &&
      nextCol >= 0 &&
      nextCol < BOARD_SIZE;

    if (isInsideBoard && board[nextRow][nextCol] === player) {
      count++;
    }
  }

  return count;
};
