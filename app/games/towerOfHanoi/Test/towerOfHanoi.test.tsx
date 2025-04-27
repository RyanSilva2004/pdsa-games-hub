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

    jest.advanceTimersByTime(300000); // Advance time by 5 minutes

    await waitFor(() => expect(screen.getByText("Game over! Time's up!")).toBeInTheDocument());
  });

  it("should save the game result to the database when the player wins", async () => {
    render(<TowerOfHanoi />);

    // Mock the axios POST request to save the game result
    axios.post.mockResolvedValue({ data: { success: true } });

    // Simulate the game play (you may need to simulate clicks on pegs to solve the puzzle)
    // For simplicity, assuming game logic will result in a win
    fireEvent.click(screen.getByRole('button', { name: /start game/i, disabled: false }));
    jest.advanceTimersByTime(5000);  // Advance time slightly to simulate game progression

    // Simulate clicking "Play Again" after winning
    fireEvent.click(screen.getByText("Play Again"));

    // Check if the axios POST request was called
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/api/towerOfHanoi", {
      playerName: "John Doe",
      moves: expect.any(Number),  // You can further mock the moves count here if needed
      timeTaken: expect.any(Number),
    }));

    expect(screen.getByText("You won!")).toBeInTheDocument();
  });

  it("should show a 'Help' modal when the Help button is clicked", () => {
    render(<TowerOfHanoi />);

    const helpButton = screen.getByText("Help");
    fireEvent.click(helpButton);

    expect(screen.getByText("How to Play")).toBeInTheDocument();

    // Using a more flexible regex matcher for the text to account for HTML breaks
    expect(screen.getByText(/Move all disks from peg A to peg C/i)).toBeInTheDocument();
  });

  it("should reset the game when the 'Restart' button is clicked", () => {
    render(<TowerOfHanoi />);

    // Start the game by filling out the name and clicking Start Game
    const inputElement = screen.getByPlaceholderText("Your name");
    fireEvent.change(inputElement, { target: { value: "John Doe" } });
    
    // Be specific about which button to click to start the game
    const startButton = screen.getByRole('button', { name: /start game/i, disabled: false });
    fireEvent.click(startButton);

    // Simulate restarting the game
    const restartButton = screen.getByText("Restart");
    fireEvent.click(restartButton);

    expect(screen.getByText("Time: 0:00")).toBeInTheDocument();
    expect(screen.getByText("Moves")).toBeInTheDocument();
  });
});
