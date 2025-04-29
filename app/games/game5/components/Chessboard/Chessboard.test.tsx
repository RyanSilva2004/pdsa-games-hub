import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Chessboard from './Chessboard';
import '@testing-library/jest-dom';
import { toast } from 'react-hot-toast';


jest.mock('react-hot-toast');
jest.mock('../Knight/Knight', () => () => <div data-testid="knight" />);
jest.mock('../GameStatus/GameStatus', () => ({ status, timeTaken, onRestart }: any) => (
  <div data-testid="game-status" data-status={status} data-time={timeTaken}>
    <button onClick={onRestart}>Mock Restart</button>
  </div>
));
jest.mock('../AlgorithmSelector/AlgorithmSelector', () => ({ algorithm, setAlgorithm }: any) => (
  <select 
    data-testid="algorithm-selector" 
    value={algorithm} 
    onChange={(e) => setAlgorithm(e.target.value)}
  >
    <option value="backtracking">Backtracking</option>
    <option value="warnsdorff">Warnsdorff</option>
  </select>
));
jest.mock('../../util/utils');
jest.mock('../../logic/backtracking');
jest.mock('../../logic/warnsdorff');
jest.mock('../../util/gameService');

const mockSolveKnightsTourBacktracking = require('../../logic/backtracking').solveKnightsTourBacktracking;
const mockSolveKnightsTourWarnsdorff = require('../../logic/warnsdorff').solveKnightsTourWarnsdorff;
const mockIsValidKnightMove = require('../../util/utils').isValidKnightMove;
const mockSaveGameResult = require('../../util/gameService').saveGameResult;

describe('Chessboard Component', () => {
  const playerName = "Test Player";

  beforeEach(() => {
    jest.useFakeTimers();
    mockIsValidKnightMove.mockReturnValue(true);
    mockSolveKnightsTourBacktracking.mockResolvedValue([[0, 0]]);
    mockSolveKnightsTourWarnsdorff.mockResolvedValue([[0, 0]]);
    mockSaveGameResult.mockResolvedValue(true);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', async () => {
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
    expect(screen.getByTestId('algorithm-selector')).toBeInTheDocument();
    expect(screen.getAllByTestId('chess-square').length).toBe(64);
    expect(screen.getByTestId('knight')).toBeInTheDocument();
    
    const gameStatus = screen.getByTestId('game-status');
    expect(gameStatus).toHaveAttribute('data-status', 'playing');
  });

  it('handles square clicks correctly', async () => {
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
    const squares = await screen.findAllByTestId('chess-square');
    await act(async () => {
      fireEvent.click(squares[10]);
    });
    
    expect(mockIsValidKnightMove).toHaveBeenCalled();
  });

  it('changes algorithm correctly', async () => {
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
    const selector = screen.getByTestId('algorithm-selector');
    await act(async () => {
      fireEvent.change(selector, { target: { value: 'warnsdorff' } });
    });
    
    expect(mockSolveKnightsTourWarnsdorff).toHaveBeenCalled();
  });

  it('handles game win condition', async () => {
    mockIsValidKnightMove.mockReturnValue(true);
    
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
   
    const mockVisited = new Set();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        mockVisited.add(`${i}-${j}`);
      }
    }
    
    
    await act(async () => {
      fireEvent.click(screen.getAllByTestId('chess-square')[0]);
     
    });
  
     
    await act(async () => {
      await Promise.resolve();
    });
  
   
    
  });
  it('handles game loss condition', async () => {
    mockIsValidKnightMove.mockReturnValue(false);
    
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
  
    await act(async () => {
      fireEvent.click(screen.getAllByTestId('chess-square')[0]);
     
    });
  
    
    await act(async () => {
      await Promise.resolve();
    });
  
 
  });

  it('resets game correctly', async () => {
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('New Game'));
    });
    
    expect(mockSolveKnightsTourBacktracking).toHaveBeenCalled();
  });

  it('shows error for invalid moves', async () => {
    mockIsValidKnightMove.mockReturnValue(false);
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
    const squares = await screen.findAllByTestId('chess-square');
    await act(async () => {
      fireEvent.click(squares[10]);
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      "Invalid knight move",
      expect.objectContaining({
        position: "top-center",
        duration: 3000
      })
    );
  });

  it('updates timer correctly', async () => {
    await act(async () => {
      render(<Chessboard playerName={playerName} />);
    });
    
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    
    const gameStatus = screen.getByTestId('game-status');
    expect(gameStatus).toHaveAttribute('data-time', '3');
  });
});