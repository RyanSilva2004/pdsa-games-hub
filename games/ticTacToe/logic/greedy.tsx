import { BOARD_SIZE } from "@/games/ticTacToe/logic/gameLogic";

export const findBestMoveGreedy = (board: string[][]): [number, number] => {
  let bestScore = -1;
  let bestMove: [number, number] = [-1, -1];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col]) {
        const blockXScore = countNearbyMatches(board, row, col, "X");

        const winOScore = countNearbyMatches(board, row, col, "O");

        // block x
        const totalScore = blockXScore + winOScore;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMove = [row, col];
        }
      }
    }
  }

  return bestMove;
};

const countNearbyMatches = (
  board: string[][],
  row: number,
  col: number,
  player: string
): number => {
  let maxCount = 0;

  // all directions
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal \
    [1, -1], // diagonal /
  ];

  for (let i = 0; i < directions.length; i++) {
    const rowChange = directions[i][0];
    const colChange = directions[i][1];

    let count = 1;

    // forward
    for (let i = 1; i < BOARD_SIZE; i++) {
      const newRow = row + rowChange * i;
      const newCol = col + colChange * i;

      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    // backward
    for (let i = 1; i < BOARD_SIZE; i++) {
      const newRow = row - rowChange * i;
      const newCol = col - colChange * i;

      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        board[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count > maxCount) {
      maxCount = count;
    }
  }

  return maxCount;
};
