import { isValidKnightMove } from './utils';

describe('isValidKnightMove', () => {
  it('returns true for valid knight move (2,1)', () => {
    expect(isValidKnightMove(0, 0, 2, 1)).toBe(true);
    expect(isValidKnightMove(0, 0, -2, 1)).toBe(true);
    expect(isValidKnightMove(0, 0, 2, -1)).toBe(true);
    expect(isValidKnightMove(0, 0, -2, -1)).toBe(true);
  });

  it('returns true for valid knight move (1,2)', () => {
    expect(isValidKnightMove(0, 0, 1, 2)).toBe(true);
    expect(isValidKnightMove(0, 0, 1, -2)).toBe(true);
    expect(isValidKnightMove(0, 0, -1, 2)).toBe(true);
    expect(isValidKnightMove(0, 0, -1, -2)).toBe(true);
  });

  it('returns false for same square', () => {
    expect(isValidKnightMove(0, 0, 0, 0)).toBe(false);
  });

  it('returns false for diagonal move', () => {
    expect(isValidKnightMove(0, 0, 1, 1)).toBe(false);
    expect(isValidKnightMove(0, 0, 2, 2)).toBe(false);
  });

  it('returns false for straight line move', () => {
    expect(isValidKnightMove(0, 0, 0, 1)).toBe(false);
    expect(isValidKnightMove(0, 0, 1, 0)).toBe(false);
    expect(isValidKnightMove(0, 0, 0, 2)).toBe(false);
    expect(isValidKnightMove(0, 0, 2, 0)).toBe(false);
  });

  it('returns false for other invalid moves', () => {
    expect(isValidKnightMove(0, 0, 3, 3)).toBe(false);
    expect(isValidKnightMove(0, 0, 2, 0)).toBe(false);
    expect(isValidKnightMove(0, 0, 3, 1)).toBe(false);
  });

  it('handles negative coordinates correctly', () => {
    expect(isValidKnightMove(-2, -1, 0, 0)).toBe(true);
    expect(isValidKnightMove(-1, -2, 0, 0)).toBe(true); 
    expect(isValidKnightMove(-1, -1, 0, 0)).toBe(false); 
  });

  it('handles symmetry of moves', () => {
    expect(isValidKnightMove(2, 1, 0, 0)).toBe(true); 
    expect(isValidKnightMove(1, 2, 0, 0)).toBe(true);
  });

  it('returns false for non-integer coordinates', () => {
    expect(isValidKnightMove(0, 0, 2.5, 1)).toBe(false);
    expect(isValidKnightMove(0, 0, 1, 2.5)).toBe(false);
    expect(isValidKnightMove(0.5, 0, 2, 1)).toBe(false);
  });
});