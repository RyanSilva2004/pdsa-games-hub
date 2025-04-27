import React from 'react';
import { render } from '@testing-library/react';
import Knight from './Knight';
import '@testing-library/jest-dom';

describe('Knight Component', () => {
  it('renders correctly with default props', () => {
    const position = { row: 0, col: 0 };
    const { container } = render(<Knight position={position} />);
    
    const knightElement = container.firstChild as HTMLElement;
    expect(knightElement).toBeInTheDocument();
    expect(knightElement).toHaveClass('absolute');
    expect(knightElement).toHaveClass('w-[50px]');
    expect(knightElement).toHaveClass('h-[50px]');
  });

  it('displays the knight chess piece', () => {
    const position = { row: 0, col: 0 };
    const { getByText } = render(<Knight position={position} />);
    
    const knightSymbol = getByText('♞');
    expect(knightSymbol).toBeInTheDocument();
    expect(knightSymbol).toHaveClass('text-4xl');
    expect(knightSymbol).toHaveClass('text-black');
  });

  it('positions itself correctly based on props', () => {
    const testCases = [
      { row: 0, col: 0, expected: 'translate(0px, 0px)' },
      { row: 1, col: 2, expected: 'translate(100px, 50px)' },
      { row: 3, col: 4, expected: 'translate(200px, 150px)' },
    ];

    testCases.forEach(({ row, col, expected }) => {
      const position = { row, col };
      const { container } = render(<Knight position={position} />);
      
      const knightElement = container.firstChild as HTMLElement;
      expect(knightElement).toHaveStyle(`transform: ${expected}`);
    });
  });

  it('has correct styling classes', () => {
    const position = { row: 0, col: 0 };
    const { container } = render(<Knight position={position} />);
    
    const knightElement = container.firstChild as HTMLElement;
    expect(knightElement).toHaveClass('flex');
    expect(knightElement).toHaveClass('items-center');
    expect(knightElement).toHaveClass('justify-center');

    const knightSymbol = knightElement.querySelector('span');
    expect(knightSymbol).toHaveClass('text-4xl');
    expect(knightSymbol).toHaveClass('mr-2');
    expect(knightSymbol).toHaveClass('text-black');
    expect(knightSymbol).toHaveClass('leading-none');
  });

  it('matches snapshot', () => {
    const position = { row: 2, col: 3 };
    const { asFragment } = render(<Knight position={position} />);
    expect(asFragment()).toMatchSnapshot();
  });
});