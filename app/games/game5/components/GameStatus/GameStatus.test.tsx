import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameStatus from './GameStatus';
import '@testing-library/jest-dom';

jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn().mockImplementation(({ children, ...props }) => {
      const { whileHover, whileTap, initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    }),
    h2: jest.fn().mockImplementation(({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <h2 {...rest}>{children}</h2>;
    }),
    p: jest.fn().mockImplementation(({ children, ...props }) => {
      const { initial, animate, transition, ...rest } = props;
      return <p {...rest}>{children}</p>;
    }),
    button: jest.fn().mockImplementation(({ children, ...props }) => {
      const { whileHover, whileTap, initial, animate, transition, ...rest } = props;
      return <button {...rest}>{children}</button>;
    }),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));


jest.mock('react-icons/fa', () => ({
  FaTrophy: () => <div data-testid="fa-trophy" />,
  FaSadTear: () => <div data-testid="fa-sad-tear" />,
  FaRedo: () => <div data-testid="fa-redo" />,
}));

describe('GameStatus Component', () => {
  const mockRestart = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Playing State', () => {
    it('renders timer in playing state', () => {
      render(<GameStatus status="playing" timeTaken={125} />);
      
      expect(screen.getByText('⏱️ 02:05')).toBeInTheDocument();
      expect(screen.queryByText('Victory!')).not.toBeInTheDocument();
      expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
    });

    it('has correct styling in playing state', () => {
      render(<GameStatus status="playing" timeTaken={30} />);
      
      const timerElement = screen.getByText(/⏱️/).parentElement;
      expect(timerElement).toHaveClass('bg-white/90');
      expect(timerElement).toHaveClass('backdrop-blur-sm');
      expect(timerElement).toHaveClass('rounded-full');
    });
  });

  describe('Win State', () => {
    it('renders victory screen correctly', () => {
      render(<GameStatus status="win" timeTaken={180} onRestart={mockRestart} />);
      
      expect(screen.getByText('Victory!')).toBeInTheDocument();
      expect(screen.getByText('You completed the Knight\'s Tour!')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 03:00')).toBeInTheDocument();
      expect(screen.getByTestId('fa-trophy')).toBeInTheDocument();
      expect(screen.getByText('Play Again')).toBeInTheDocument();
    });

    it('has correct styling in win state', () => {
      render(<GameStatus status="win" timeTaken={90} />);
      
     
      const modal = screen.getByText('Victory!').closest('div[class*="from-emerald-400"]');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveClass('to-teal-600');
      
      const button = screen.getByText('Play Again');
      expect(button).toHaveClass('bg-yellow-500');
    });

    it('calls restart handler when button clicked', () => {
      render(<GameStatus status="win" timeTaken={60} onRestart={mockRestart} />);
      
      fireEvent.click(screen.getByText('Play Again'));
      expect(mockRestart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loss State', () => {
    it('renders loss screen correctly', () => {
      render(<GameStatus status="loss" timeTaken={240} onRestart={mockRestart} />);
      
      expect(screen.getByText('Game Over')).toBeInTheDocument();
      expect(screen.getByText('No more valid moves available')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 04:00')).toBeInTheDocument();
      expect(screen.getByTestId('fa-sad-tear')).toBeInTheDocument();
      expect(screen.getByText('Play Again')).toBeInTheDocument();
    });

    it('has correct styling in loss state', () => {
      render(<GameStatus status="loss" timeTaken={150} />);
      
     
      const modal = screen.getByText('Game Over').closest('div[class*="from-rose-400"]');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveClass('to-pink-600');
      
      const button = screen.getByText('Play Again');
      expect(button).toHaveClass('bg-purple-700');
    });

    it('calls restart handler when button clicked', () => {
      render(<GameStatus status="loss" timeTaken={45} onRestart={mockRestart} />);
      
      fireEvent.click(screen.getByText('Play Again'));
      expect(mockRestart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Time Formatting', () => {
    const testCases = [
      { seconds: 0, expected: '00:00' },
      { seconds: 59, expected: '00:59' },
      { seconds: 60, expected: '01:00' },
      { seconds: 125, expected: '02:05' },
      { seconds: 3599, expected: '59:59' },
    ];

    testCases.forEach(({ seconds, expected }) => {
      it(`formats ${seconds} seconds as ${expected}`, () => {
        render(<GameStatus status="playing" timeTaken={seconds} />);
        expect(screen.getByText(`⏱️ ${expected}`)).toBeInTheDocument();
      });
    });
  });
});