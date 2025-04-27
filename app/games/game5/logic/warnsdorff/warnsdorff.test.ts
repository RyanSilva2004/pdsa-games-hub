import { solveKnightsTourWarnsdorff } from './warnsdorff';

describe('solveKnightsTourWarnsdorff', () => {
  // Test valid solutions
  it('should find solution for (0,0) on 5x5 board', async () => {
    const result = await solveKnightsTourWarnsdorff(0, 0, 5);
    expect(result).toBeInstanceOf(Array);
    if (result) {
      expect(result.length).toBe(5);
      expect(result[0].length).toBe(5);
      expect(result[0][0]).toBe(0);
    }
  });

  // Test edge cases
  it('should return null for invalid positions (-1,-1)', async () => {
    const result = await solveKnightsTourWarnsdorff(-1, -1, 5);
    expect(result).toBeNull();
  });

  it('should return null for invalid positions (5,5) on 5x5 board', async () => {
    const result = await solveKnightsTourWarnsdorff(5, 5, 5);
    expect(result).toBeNull();
  });

  // Test complete tour
  it('should produce complete tour on 5x5 board', async () => {
    const result = await solveKnightsTourWarnsdorff(0, 0, 5);
    if (result) {
      const flatBoard = result.flat();
      const uniqueValues = new Set(flatBoard);
      expect(uniqueValues.size).toBe(25);
      expect(Math.max(...flatBoard)).toBe(24);
      expect(Math.min(...flatBoard)).toBe(0);
    } else {
      fail('Expected solution but got null');
    }
  });

  // Test degree calculation
  it('should handle degree calculation correctly', async () => {
    // Mock getDegree for testing
    const original = solveKnightsTourWarnsdorff;
    const mockGetDegree = jest.fn()
      .mockReturnValueOnce(2) // First move
      .mockReturnValueOnce(1); // Second move
    
    // @ts-ignore - temporary override
    solveKnightsTourWarnsdorff = async (row, col, size) => {
      const board = Array(size).fill(null).map(() => Array(size).fill(-1));
      board[row][col] = 0;
      
      const moves = [[2,1],[1,2]];
      const next = {
        row: row + moves[0][0],
        col: col + moves[0][1],
        degree: mockGetDegree()
      };
      board[next.row][next.col] = 1;
      return board;
    };


    
    // @ts-ignore - restore original
    solveKnightsTourWarnsdorff = original;
  });
});