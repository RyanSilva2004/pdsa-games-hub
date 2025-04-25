export const solveKnightsTourWarnsdorff = async (
  startRow: number,
  startCol: number,
  boardSize: number = 8
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
  board[startRow][startCol] = 0;

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

  const getDegree = (row: number, col: number): number => {
    let count = 0;
    for (const [dr, dc] of moves) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize &&
        board[newRow][newCol] === -1
      ) {
        count++;
      }
    }
    return count;
  };

  let currentRow = startRow;
  let currentCol = startCol;
  
  for (let move = 1; move < boardSize * boardSize; move++) {
    const nextMoves = moves
      .map(([dr, dc]) => ({
        row: currentRow + dr,
        col: currentCol + dc
      }))
      .filter(({ row, col }) => 
        row >= 0 &&
        row < boardSize &&
        col >= 0 &&
        col < boardSize &&
        board[row][col] === -1
      )
      .map(move => ({
        ...move,
        degree: getDegree(move.row, move.col)
      }))
      .sort((a, b) => a.degree - b.degree);

    if (nextMoves.length === 0) {
      return null;
    }

    // Select move with smallest degree, random if ties
    const candidates = nextMoves.filter(
      m => m.degree === nextMoves[0].degree
    );
    const next = candidates.length > 1
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : nextMoves[0];

    board[next.row][next.col] = move;
    currentRow = next.row;
    currentCol = next.col;
  }

  return board;
};