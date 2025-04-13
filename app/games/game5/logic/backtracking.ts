export const solveKnightsTourBacktracking = (
    startRow: number,
    startCol: number,
    boardSize: number = 8
  ): number[][] | null => {
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
  
    const backtrack = (row: number, col: number, moveCount: number): boolean => {
      if (moveCount === boardSize * boardSize) {
        return true;
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
          if (backtrack(nextRow, nextCol, moveCount + 1)) {
            return true;
          }
          board[nextRow][nextCol] = -1;
        }
      }
      return false;
    };
  
    if (backtrack(startRow, startCol, 1)) {
      return board;
    }
    return null;
  };