export const BOARD_SIZE = 5;

export const emptyBoard = (): string[][] => {
  let board: string[][] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    let row: string[] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
};

export const handleMove = (
  board: string[][],
  history: string[][][],
  row: number,
  col: number,
  player: string
) => {
  let newBoard = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    newBoard.push([...board[i]]);
  }

  newBoard[row][col] = player;
  history.push(newBoard);

  return { newBoard, newHistory: history };
};

export const handleUndoMove = () => {};

export const checkWinner = () => {
  // check rows
  // check columns
  // check diagonals
};

export const handleComputerMove = () => {};
