import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TowerOfHanoi from "../page"; // Adjust the path as per your project structure
import axios from "axios";

// Mock the axios POST request
jest.mock("axios");

// Import jest-dom for `toBeInTheDocument` matcher
import '@testing-library/jest-dom';

describe("TowerOfHanoi", () => {
  it("should start the game when the player enters a name", () => {
    render(<TowerOfHanoi />);

    const inputElement = screen.getByPlaceholderText("Your name");

    // Get the enabled "Start Game" button (not disabled)
    const startButton = screen.getByRole('button', { name: /start game/i, disabled: false });

    fireEvent.change(inputElement, { target: { value: "John Doe" } });
    fireEvent.click(startButton);

    expect(screen.getByText("Time: 0:00")).toBeInTheDocument();
    expect(screen.getByText("Moves")).toBeInTheDocument();
  });

  it("should display 'Game over! Time's up!' if time runs out", async () => {
    render(<TowerOfHanoi />);

    const inputElement = screen.getByPlaceholderText("Your name");
    const startButton = screen.getByRole('button', { name: /start game/i, disabled: false });

    fireEvent.change(inputElement, { target: { value: "John Doe" } });
    fireEvent.click(startButton);

    jest.advanceTimersByTime(300000); 

    await waitFor(() => expect(screen.getByText("Game over! Time's up!")).toBeInTheDocument());
  });

  it("should save the game result to the database when the player wins", async () => {
    render(<TowerOfHanoi />);

    
    axios.post.mockResolvedValue({ data: { success: true } });

    
    fireEvent.click(screen.getByRole('button', { name: /start game/i, disabled: false }));
    jest.advanceTimersByTime(5000);  
    fireEvent.click(screen.getByText("Play Again"));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/api/towerOfHanoi", {
      playerName: "John Doe",
      moves: expect.any(Number),  
      timeTaken: expect.any(Number),
    }));

    expect(screen.getByText("You won!")).toBeInTheDocument();
  });

  it("should show a 'Help' modal when the Help button is clicked", () => {
    render(<TowerOfHanoi />);

    const helpButton = screen.getByText("Help");
    fireEvent.click(helpButton);

    expect(screen.getByText("How to Play")).toBeInTheDocument();

    
    expect(screen.getByText(/Move all disks from peg A to peg C/i)).toBeInTheDocument();
  });

  it("should reset the game when the 'Restart' button is clicked", () => {
    render(<TowerOfHanoi />);


    const inputElement = screen.getByPlaceholderText("Your name");
    fireEvent.change(inputElement, { target: { value: "John Doe" } });
    
    
    const startButton = screen.getByRole('button', { name: /start game/i, disabled: false });
    fireEvent.click(startButton);

    const restartButton = screen.getByText("Restart");
    fireEvent.click(restartButton);

    expect(screen.getByText("Time: 0:00")).toBeInTheDocument();
    expect(screen.getByText("Moves")).toBeInTheDocument();
  });
});
