import { solveKnightsTourBacktracking } from './backtracking';

describe('solveKnightsTourBacktracking', () => {
  // Increase timeout for these tests since we're doing actual computation
  jest.setTimeout(10000);

  describe('valid solutions', () => {
    it('should find a solution for a valid starting position (0,0)', async () => {
      const result = await solveKnightsTourBacktracking(0, 0, 5); // Using smaller 5x5 board
      expect(result).toBeInstanceOf(Array);
      if (result) {
        expect(result.length).toBe(5);
        expect(result[0].length).toBe(5);
        expect(result[0][0]).toBe(0);
      }
    });

    it('should find a solution for position (1,1) on 5x5 board', async () => {
      const result = await solveKnightsTourBacktracking(1, 1, 5);
      
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid starting positions (-1,-1)', async () => {
      const result = await solveKnightsTourBacktracking(-1, -1);
      expect(result).toBeNull();
    });

    it('should return null for invalid starting positions (8,8)', async () => {
      const result = await solveKnightsTourBacktracking(8, 8);
      expect(result).toBeNull();
    });
  });

  describe('timeout behavior', () => {
    it('should return null when exceeding max iterations', async () => {
      const result = await solveKnightsTourBacktracking(0, 0, 8, 100);
      expect(result).toBeNull();
    });
  });

  describe('solution validation', () => {
    it('should produce a valid tour when solution exists', async () => {
      const result = await solveKnightsTourBacktracking(0, 0, 5);
      if (result) {
        const flatBoard = result.flat();
        const uniqueValues = new Set(flatBoard);
        
        expect(uniqueValues.size).toBe(25); // All squares visited
        expect(Math.max(...flatBoard)).toBe(24); // Last move number
        expect(Math.min(...flatBoard)).toBe(0); // Starting position
      }
    });
  });
});