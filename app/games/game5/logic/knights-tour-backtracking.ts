export const isValidMove = (
    row: number,
    col: number,
    board: number[][],
    size: number
  ): boolean => {
    return (
      row >= 0 &&
      row < size &&
      col >= 0 &&
      col < size &&
      board[row][col] === 0
    );
  };
  
  export const getKnightMoves = (
    row: number,
    col: number,
    size: number
  ): [number, number][] => {
    const moves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    return moves
      .map(([dr, dc]) => [row + dr, col + dc] as [number, number])
      .filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size);
  };
  
  export const solveKnightsTourBacktracking = (
    board: number[][],
    row: number,
    col: number,
    moveCount: number
  ): boolean => {
    if (moveCount === board.length * board[0].length) {
      return true;
    }
  
    const moves = getKnightMoves(row, col, board.length);
    for (const [nextRow, nextCol] of moves) {
      if (isValidMove(nextRow, nextCol, board, board.length)) {
        board[nextRow][nextCol] = moveCount + 1;
        if (solveKnightsTourBacktracking(board, nextRow, nextCol, moveCount + 1)) {
          return true;
        }
        board[nextRow][nextCol] = 0;
      }
    }
    return false;
  };