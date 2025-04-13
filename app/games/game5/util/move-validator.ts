import { isValidMove, getKnightMoves } from "../logic/knights-tour-backtracking";

export const validateMove = (
  from: [number, number],
  to: [number, number],
  board: number[][]
): boolean => {
  const moves = getKnightMoves(from[0], from[1], board.length);
  return (
    moves.some(([r, c]) => r === to[0] && c === to[1]) &&
    isValidMove(to[0], to[1], board, board.length)
  );
};