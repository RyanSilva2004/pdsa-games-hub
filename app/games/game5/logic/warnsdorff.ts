export const solveKnightsTourWarnsdorff = (
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
  
    const getDegree = (row: number, col: number): number => {
      let count = 0;
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
          count++;
        }
      }
      return count;
    };
  
    let row = startRow;
    let col = startCol;
    for (let move = 1; move < boardSize * boardSize; move++) {
      const nextMoves: [number, number, number][] = [];
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
          nextMoves.push([nextRow, nextCol, getDegree(nextRow, nextCol)]);
        }
      }
  
      if (nextMoves.length === 0) {
        return null;
      }
  
      nextMoves.sort((a, b) => a[2] - b[2]);
      const [nextRow, nextCol] = nextMoves[0];
      board[nextRow][nextCol] = move;
      row = nextRow;
      col = nextCol;
    }
  
    return board;
  };