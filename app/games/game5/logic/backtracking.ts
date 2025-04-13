export const solveKnightsTourBacktracking = async (
  startRow: number,
  startCol: number,
  boardSize: number = 8,
  maxIterations: number = 500000, // Reduced for faster timeout
  timeoutMs: number = 1000 // Stricter 1-second timeout
): Promise<number[][] | null> => {
  const board = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill(-1));
  const moves = [
    [2, 1],
    [1, 2],
    [-1, 2],
    [-2, 1],
    [-2, -1],
    [-1, -2],
    [1, -2],
    [2, -1],
  ];

  board[startRow][startCol] = 0;
  let iterations = 0;
  const startTime = Date.now();

  const backtrack = async (
    row: number,
    col: number,
    moveCount: number
  ): Promise<boolean> => {
    if (moveCount === boardSize * boardSize) {
      return true;
    }
    if (iterations >= maxIterations || Date.now() - startTime > timeoutMs) {
      return false;
    }

    for (const [dr, dc] of moves) {
      const nextRow = row + dr;
      const nextCol = col + dc;

      if (
        nextRow >= 0 &&
        nextRow < boardSize &&
        nextCol >= 0 &&
        nextCol < boardSize &&
        board[nextRow][nextCol] === -1
      ) {
        board[nextRow][nextCol] = moveCount;
        iterations++;
        if (iterations % 2000 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        if (await backtrack(nextRow, nextCol, moveCount + 1)) {
          return true;
        }
        board[nextRow][nextCol] = -1;
      }
    }
    return false;
  };

  if (await backtrack(startRow, startCol, 1)) {
    return board;
  }
  return null;
};