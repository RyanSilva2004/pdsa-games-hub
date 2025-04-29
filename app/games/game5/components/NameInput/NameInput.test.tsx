import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import NameInput from './NameInput';
import '@testing-library/jest-dom';

jest.mock('react-icons/fa', () => ({
  FaUser: () => <div data-testid="fa-user" />,
  FaArrowRight: () => <div data-testid="fa-arrow-right" />,
}));


jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, transition, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('NameInput Component', () => {
  const mockSubmit = jest.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('renders correctly with all elements', () => {
    render(<NameInput onSubmit={mockSubmit} />);
    
    expect(screen.getByPlaceholderText("Enter your knight's name")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Begin the Quest/i })).toBeInTheDocument();
    expect(screen.getByText(/Your name will be recorded/)).toBeInTheDocument();
    expect(screen.getByTestId('fa-user')).toBeInTheDocument();
  });

  it('shows validation errors appropriately', async () => {
    render(<NameInput onSubmit={mockSubmit} />);
    const input = screen.getByPlaceholderText("Enter your knight's name");
    const submitButton = screen.getByRole('button', { name: /Begin the Quest/i });

     
    fireEvent.click(submitButton);
    expect(await screen.findByText('Please enter your name')).toBeInTheDocument();

    
    fireEvent.change(input, { target: { value: 'ThisNameIsWayTooLongForTheInputField' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText('Name must be less than 20 characters')).toBeInTheDocument();

    
    fireEvent.change(input, { target: { value: 'Invalid@Name' } });
    fireEvent.click(submitButton);
    expect(await screen.findByText('Name can only contain letters, numbers, and spaces')).toBeInTheDocument();
  });

  it('submits valid form data', async () => {
    render(<NameInput onSubmit={mockSubmit} />);
    const input = screen.getByPlaceholderText("Enter your knight's name");
    const submitButton = screen.getByRole('button', { name: /Begin the Quest/i });

    fireEvent.change(input, { target: { value: '  Sir Galahad  ' } });
    fireEvent.click(submitButton);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith('Sir Galahad');
  });

  it('shows character counter when typing', () => {
    render(<NameInput onSubmit={mockSubmit} />);
    const input = screen.getByPlaceholderText("Enter your knight's name");

    fireEvent.change(input, { target: { value: 'Arthur' } });
    expect(screen.getByText('6/20')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Lancelot' } });
    expect(screen.getByText('8/20')).toBeInTheDocument();
  });

  it('clears error message when user starts typing', async () => {
    render(<NameInput onSubmit={mockSubmit} />);
    const input = screen.getByPlaceholderText("Enter your knight's name");
    const submitButton = screen.getByRole('button', { name: /Begin the Quest/i });

    fireEvent.click(submitButton);
    expect(await screen.findByText('Please enter your name')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'A' } });
    expect(screen.queryByText('Please enter your name')).not.toBeInTheDocument();
  });

  it('applies focus styles correctly', () => {
    render(<NameInput onSubmit={mockSubmit} />);
    const input = screen.getByPlaceholderText("Enter your knight's name");
    const iconContainer = screen.getByTestId('fa-user').parentElement;

     
    expect(iconContainer).not.toHaveClass('text-indigo-500');


    fireEvent.focus(input);
    expect(iconContainer).toHaveClass('text-indigo-500');


    fireEvent.blur(input);
    expect(iconContainer).not.toHaveClass('text-indigo-500');
  });
});