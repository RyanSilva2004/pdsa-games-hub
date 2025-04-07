import { BOARD_SIZE } from "@/games/ticTacToe/logic/gameLogic";

export function findBestMoveGreedy(board: string[][]): [number, number] {
  let bestScore = -Infinity;
  let bestMove: [number, number] = [-1, -1];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!board[row][col]) {
    
        let xThreatScore = countLines(board, row, col, "X");

        let oOpportunityScore = countLines(board, row, col, "O");

        // block X
        let totalScore = xThreatScore * 2 - oOpportunityScore;

        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMove = [row, col];
        }
      }
    }
  }

  return bestMove;
}

function countLines(
  board: string[][],
  row: number,
  col: number,
  player: string
): number {
  // check directions
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal \
    [1, -1],  // diagonal /
  ];

  let maxCount = 0;

  for (let i = 0; i < directions.length; i++) {
    const dx = directions[i][0];
    const dy = directions[i][1];

    let count = 1; 

    for (let dir = -1; dir <= 1; dir += 2) {
      let r = row + dir * dx;
      let c = col + dir * dy;

      while (
        r >= 0 && r < BOARD_SIZE &&
        c >= 0 && c < BOARD_SIZE &&
        board[r][c] === player
      ) {
        count++;
        r += dir * dx;
        c += dir * dy;
      }
    }

    if (count > maxCount) {
      maxCount = count;
    }
  }

  return maxCount;
}
