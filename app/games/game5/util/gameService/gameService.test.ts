import { addDoc, collection } from 'firebase/firestore';
import { saveGameResult, GameResult } from './gameService';
import { firestore } from '../../../../../lib/firebase';

// Mock Firebase Firestore
jest.mock('firebase/firestore');
jest.mock('../../../../lib/firebase', () => ({
  firestore: {},
}));

// Mock console methods to verify logging
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('gameService', () => {
  const validGameResult: GameResult = {
    playerName: 'TestPlayer',
    status: 'win',
    timeTaken: 120,
    moves: [{ row: 0, col: 0 }, { row: 2, col: 1 }],
    algorithm: 'backtracking',
    timestamp: new Date('2025-04-18T12:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (addDoc as jest.Mock).mockResolvedValue({ id: 'mockDocId' });
    (collection as jest.Mock).mockReturnValue('mockCollection');
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('validateGameResult', () => {
    it('returns null for a valid game result', async () => {
      await expect(saveGameResult(validGameResult)).resolves.toBe(true);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('throws error for empty player name', async () => {
      const invalidResult = { ...validGameResult, playerName: '' };
      await expect(saveGameResult(invalidResult)).rejects.toThrow('Invalid player name');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation failed:', 'Invalid player name');
    });

    it('throws error for player name longer than 20 characters', async () => {
      const invalidResult = { ...validGameResult, playerName: 'ThisNameIsWayTooLongForValidation' };
      await expect(saveGameResult(invalidResult)).rejects.toThrow('Invalid player name');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation failed:', 'Invalid player name');
    });

    it('throws error for invalid game status', async () => {
      const invalidResult = { ...validGameResult, status: 'draw' as any };
      await expect(saveGameResult(invalidResult)).rejects.toThrow('Invalid game status');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation failed:', 'Invalid game status');
    });

    it('throws error for negative time taken', async () => {
      const invalidResult = { ...validGameResult, timeTaken: -10 };
      await expect(saveGameResult(invalidResult)).rejects.toThrow('Invalid time taken');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation failed:', 'Invalid time taken');
    });

    it('throws error for non-numeric time taken', async () => {
      const invalidResult = { ...validGameResult, timeTaken: '120' as any };
      await expect(saveGameResult(invalidResult)).rejects.toThrow('Invalid time taken');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation failed:', 'Invalid time taken');
    });

    it('throws error for non-array moves', async () => {
      const invalidResult = { ...validGameResult, moves: { row: 0, col: 0 } as any };
      await expect(saveGameResult(invalidResult)).rejects.toThrow('Invalid moves data');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation failed:', 'Invalid moves data');
    });

    it('throws error for invalid algorithm', async () => {
      const invalidResult = { ...validGameResult, algorithm: 'invalid' as any };
      await expect(saveGameResult(invalidResult)).rejects.toThrow('Invalid algorithm');
      expect(mockConsoleError).toHaveBeenCalledWith('Validation failed:', 'Invalid algorithm');
    });
  });

  describe('saveGameResult', () => {
    it('saves valid game result to Firestore and returns true', async () => {
      await saveGameResult(validGameResult);

      expect(collection).toHaveBeenCalledWith(firestore, 'gameResults');
      expect(addDoc).toHaveBeenCalledWith('mockCollection', {
        ...validGameResult,
        timestamp: expect.any(Date),
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('Game result saved with ID: ', 'mockDocId');
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('sets timestamp to current date in Firestore', async () => {
      const mockDate = new Date('2025-04-18T12:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      await saveGameResult(validGameResult);

      expect(addDoc).toHaveBeenCalledWith('mockCollection', {
        ...validGameResult,
        timestamp: mockDate,
      });

      jest.spyOn(global, 'Date').mockRestore();
    });

    it('throws error when Firestore save fails', async () => {
      (addDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(saveGameResult(validGameResult)).rejects.toThrow('Failed to save game result to database');
      expect(mockConsoleError).toHaveBeenCalledWith('Error adding document: ', expect.any(Error));
    });
  });
});