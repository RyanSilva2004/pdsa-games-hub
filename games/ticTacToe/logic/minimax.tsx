import { BOARD_SIZE } from "@/games/ticTacToe/logic/gameLogic";

const evaluateBoard = (board: string[][]): number => {
  const scoreLine = (line: string[]): number => {
    const countX = line.filter((cell) => cell === "X").length;
    const countO = line.filter((cell) => cell === "O").length;

    // X and O are in the same line. blocked. no score
    if (countX > 0 && countO > 0) return 0;

    // more Os in a line. computer winning
    if (countX === 0 && countO > 0) return Math.pow(10, countO);

    // more Xs in a line. player winning
    if (countO === 0 && countX > 0) return -Math.pow(10, countX);

    return 0;
  };

  let totalScore = 0;

  // check rows
  for (let i = 0; i < BOARD_SIZE; i++) {
    totalScore += scoreLine(board[i]);

    // check columns
    const column = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      column.push(board[j][i]);
    }
    totalScore += scoreLine(column);
  }

  // check diagonals
  const mainDiagonal = [];
  const antiDiagonal = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    mainDiagonal.push(board[i][i]);
    antiDiagonal.push(board[i][BOARD_SIZE - 1 - i]);
  }
  totalScore += scoreLine(mainDiagonal);
  totalScore += scoreLine(antiDiagonal);

  return totalScore;
};

const hasMovesLeft = (board: string[][]): boolean => {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (!board[i][j]) return true;
    }
  }
  return false;
};

// minimax algorithm with alpha-beta pruning and depth limiting
const minimax = (
  board: string[][],
  depth: number,
  isComputerTurn: boolean,
  alpha: number,
  beta: number,
  depthLimit: number
): number => {
  if (depth === depthLimit || !hasMovesLeft(board)) {
    // no moves
    return evaluateBoard(board);
  }

  if (isComputerTurn) {
    // max computer
    let bestScore = -Infinity;

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (!board[i][j]) {
          board[i][j] = "O";
          const score = minimax(
            board,
            depth + 1,
            false,
            alpha,
            beta,
            depthLimit
          );
          board[i][j] = null;

          bestScore = Math.max(bestScore, score);
          alpha = Math.max(alpha, score);

          if (beta <= alpha) break;
        }
      }
    }

    return bestScore;
  } else {
    // minimizing player
    let bestScore = Infinity;

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (!board[i][j]) {
          board[i][j] = "X";
          const score = minimax(
            board,
            depth + 1,
            true,
            alpha,
            beta,
            depthLimit
          );
          board[i][j] = null;

          bestScore = Math.min(bestScore, score);
          beta = Math.min(beta, score);

          if (beta <= alpha) break;
        }
      }
    }

    return bestScore;
  }
};

const checkWin = (board: string[][], player: string): boolean => {
    // check rows and columns
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (board[i].every((cell) => cell === player)) return true;
  
      let columnWin = true;
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[j][i] !== player) {
          columnWin = false;
          break;
        }
      }
      if (columnWin) return true;
    }
  
    // check main diagonal
    let mainDiagonal = true;
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (board[i][i] !== player) {
        mainDiagonal = false;
        break;
      }
    }
    if (mainDiagonal) return true;
  
    // check anti diagonal
    let antiDiagonal = true;
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (board[i][BOARD_SIZE - 1 - i] !== player) {
        antiDiagonal = false;
        break;
      }
    }
    if (antiDiagonal) return true;
  
    return false;
  };
  

export const findBestMoveMinimax = (board: string[][]): [number, number] => {
  let bestScore = -Infinity;
  let bestMove: [number, number] = [-1, -1];

  const depthLimit = 3;

  // try win for computer 1st
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (!board[i][j]) {
        board[i][j] = "O";
        if (checkWin(board, "O")) {
          board[i][j] = null;
          return [i, j];
        }
        board[i][j] = null;
      }
    }
  }

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (!board[i][j]) {
        board[i][j] = "O";
        const score = minimax(board, 0, false, -Infinity, Infinity, depthLimit);
        board[i][j] = null;

        if (score > bestScore) {
          bestScore = score;
          bestMove = [i, j];
        }
      }
    }
  }

  return bestMove;
};
