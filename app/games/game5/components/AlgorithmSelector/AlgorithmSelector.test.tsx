import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlgorithmSelector from './AlgorithmSelector';
import { FaChessBoard, FaChessKnight } from 'react-icons/fa';

const mockSetAlgorithm = jest.fn();

describe('AlgorithmSelector', () => {
  const defaultProps = {
    algorithm: 'backtracking' as 'backtracking' | 'warnsdorff',
    setAlgorithm: mockSetAlgorithm,
  };

  beforeEach(() => {
    mockSetAlgorithm.mockClear();
  });

  test('renders the select element with the correct initial value', () => {
    render(<AlgorithmSelector {...defaultProps} />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('backtracking');
    expect(screen.getByText('Backtracking Algorithm')).toBeInTheDocument();
    expect(screen.getByText("Warnsdorff's Heuristic")).toBeInTheDocument();
  });

  test('displays the correct label and icons', () => {
    render(<AlgorithmSelector {...defaultProps} />);
    expect(screen.getByText('Select Algorithm')).toBeInTheDocument();
    const chessBoardIcon = document.querySelector('svg');
    expect(chessBoardIcon).toBeInTheDocument();
    const knightIcons = document.querySelectorAll('svg');
    expect(knightIcons.length).toBeGreaterThanOrEqual(2);
  });

  test('calls setAlgorithm when a new option is selected', () => {
    render(<AlgorithmSelector {...defaultProps} />);
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'warnsdorff' } });
    expect(mockSetAlgorithm).toHaveBeenCalledWith('warnsdorff');
    expect(mockSetAlgorithm).toHaveBeenCalledTimes(1);
  });

  test('applies correct styles for backtracking algorithm', () => {
    render(<AlgorithmSelector {...defaultProps} />);
    const backtrackingSpan = screen.getByText('Exhaustive search');
    const warnsdorffSpan = screen.getByText('Heuristic approach');
    expect(backtrackingSpan).toHaveClass('text-indigo-600', 'font-medium');
    expect(warnsdorffSpan).not.toHaveClass('text-indigo-600', 'font-medium');
  });

  test('applies correct styles for warnsdorff algorithm', () => {
    render(<AlgorithmSelector {...defaultProps} algorithm="warnsdorff" />);
    const backtrackingSpan = screen.getByText('Exhaustive search');
    const warnsdorffSpan = screen.getByText('Heuristic approach');
    expect(warnsdorffSpan).toHaveClass('text-indigo-600', 'font-medium');
    expect(backtrackingSpan).not.toHaveClass('text-indigo-600', 'font-medium');
  });

  test('renders correctly with warnsdorff algorithm selected', () => {
    render(<AlgorithmSelector {...defaultProps} algorithm="warnsdorff" />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('warnsdorff');
    expect(screen.getByText('Backtracking Algorithm')).toBeInTheDocument();
    expect(screen.getByText("Warnsdorff's Heuristic")).toBeInTheDocument();
  });

  test('select element has correct accessibility attributes', () => {
    render(<AlgorithmSelector {...defaultProps} />);
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveAccessibleName('Select Algorithm');
  });
});