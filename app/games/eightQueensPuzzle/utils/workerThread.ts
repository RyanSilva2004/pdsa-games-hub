interface WorkerMessage {
  n: number;
}
interface Result {
  solutions: number[][];
}
onmessage = function (e: MessageEvent<WorkerMessage>) {
  const { n } = e.data;
  const results: number[][] = [];

  const isSafe = (board: number[], row: number, col: number): boolean => {
    for (let i = 0; i < row; i++) {
      if (board[i] === col || Math.abs(board[i] - col) === Math.abs(i - row)) {
        return false;
      }
    }
    return true;
  };

  const solveNQueens = (board: number[], row: number): void => {
    if (row === n) {
      results.push([...board]);
      return;
    }
    for (let col = 0; col < n; col++) {
      if (isSafe(board, row, col)) {
        board[row] = col;
        solveNQueens(board, row + 1);
        board[row] = -1;
      }
    }
  };

  solveNQueens(Array(n).fill(-1), 0);
  postMessage(results);
};
