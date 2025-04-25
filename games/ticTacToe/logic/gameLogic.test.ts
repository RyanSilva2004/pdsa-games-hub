import {
    emptyBoard,
    handleMove,
    handleUndoMove,
    checkWinner,
    handleComputerMove,
    BOARD_SIZE,
  } from "./gameLogic";
  
  describe("Game Logic", () => {
    it("should initialize an empty board", () => {
      const board = emptyBoard();
      expect(board.length).toBe(BOARD_SIZE);
      expect(board[0].length).toBe(BOARD_SIZE);
      expect(board.flat().every((cell) => cell === null)).toBe(true);
    });
  
    it("should handle player move", () => {
      const board = emptyBoard();
      const history: string[][][] = [];
      const { newBoard, newHistory } = handleMove(board, history, 1, 1, "X");
  
      expect(newBoard[1][1]).toBe("X");
      expect(newHistory.length).toBe(1);
    });
  
    it("should undo the last move", () => {
      const board = emptyBoard();
      let history: string[][][] = [];
  
      // Player 'X' makes the first move
      let move1 = handleMove(board, history, 0, 0, "X");
      history = move1.newHistory;
  
      // Computer 'O' makes the second move
      let move2 = handleMove(history[0], history, 1, 1, "O");
      history = move2.newHistory;
  
      // Undo both moves (player and computer)
      const { newBoard, newHistory } = handleUndoMove(history);
  
      expect(newBoard[0][0]).toBe(null); 
      expect(newBoard[1][1]).toBe(null); 
      expect(newHistory.length).toBe(0);
    });
  
    it("should detect a row win", () => {
      const board = emptyBoard();
      for (let i = 0; i < BOARD_SIZE; i++) {
        board[0][i] = "X";
      }
      expect(checkWinner(board)).toBe("X");
    });
  
    it("should detect a column win", () => {
      const board = emptyBoard();
      for (let i = 0; i < BOARD_SIZE; i++) {
        board[i][0] = "O";
      }
      expect(checkWinner(board)).toBe("O");
    });
  
    it("should detect a diagonal win", () => {
      const board = emptyBoard();
      for (let i = 0; i < BOARD_SIZE; i++) {
        board[i][i] = "X";
      }
      expect(checkWinner(board)).toBe("X");
    });
  });
  