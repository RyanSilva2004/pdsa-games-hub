export const solveKnightsTourBacktracking = async (
  startRow: number,
  startCol: number,
  boardSize: number = 8,
  maxIterations: number = 500000,
  timeoutMs: number = 1000
): Promise<number[][] | null> => {
  // Validate inputs first
  if (
    startRow < 0 || startRow >= boardSize ||
    startCol < 0 || startCol >= boardSize
  ) {
    return null;
  }

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

    // Try all possible moves in random order for better performance
    const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);
    
    for (const [dr, dc] of shuffledMoves) {
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
        
        // Yield to event loop periodically
        if (iterations % 2000 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        
        if (await backtrack(nextRow, nextCol, moveCount + 1)) {
          return true;
        }
        
        // Backtrack
        board[nextRow][nextCol] = -1;
      }
    }
    return false;
  };

  return (await backtrack(startRow, startCol, 1)) ? board : null;
};