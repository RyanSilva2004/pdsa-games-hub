import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TicTacToe } from "./tic-tac-toe";

describe("TicTacToe Component", () => {
  beforeEach(() => {
    render(<TicTacToe />);
  });

  it("renders the player name input screen", () => {
    expect(screen.getByText(/Enter Your Name to Start/i)).toBeInTheDocument();
  });

  it("starts the game after entering a player name", () => {
    const input = screen.getByPlaceholderText("Your name");
    const startButton = screen.getByText("Start Game");

    fireEvent.change(input, { target: { value: "Player1" } });
    fireEvent.click(startButton);

    expect(
      screen.getByText(/Hello, Player1! It's your turn/i)
    ).toBeInTheDocument();
  });

  describe("Gameplay", () => {
    beforeEach(() => {
      const input = screen.getByPlaceholderText("Your name");
      const startButton = screen.getByText("Start Game");
      fireEvent.change(input, { target: { value: "Player1" } });
      fireEvent.click(startButton);
    });

    it("renders the game board with correct cells", () => {
      const gameBoard = screen.getByTestId("game-board");
      const cells = gameBoard.querySelectorAll("button");
      expect(cells.length).toBe(25);
    });

    it("allows the player to make a move", () => {
      const cells = screen.getAllByRole("button");
      const gameCell = cells.find(
        (cell) =>
          cell.closest('[data-testid="game-board"]') && !cell.textContent
      );
      if (gameCell) {
        fireEvent.click(gameCell);
        expect(gameCell).toHaveTextContent("X");
      }
    });

    it("displays the correct turn after a move", async () => {
      jest.useFakeTimers();

      const cells = screen.getAllByRole("button");
      const gameCell = cells.find(
        (cell) =>
          cell.closest('[data-testid="game-board"]') && !cell.textContent
      );

      if (gameCell) {
        fireEvent.click(gameCell);

        jest.runAllTimers();

        await waitFor(() => {
          const turnElement = screen.getByText((content, element) => {
            return (
              element?.tagName.toLowerCase() === "h2" &&
              content.includes("Hello, Player1!") &&
              content.includes("turn")
            );
          });

          expect(turnElement.textContent).toMatch(/your/i);
        });
      }

      jest.useRealTimers();
    });

    it("disables cells after a move is made", () => {
      const cells = screen.getAllByRole("button");
      const gameCell = cells.find(
        (cell) =>
          cell.closest('[data-testid="game-board"]') && !cell.textContent
      );
      if (gameCell) {
        fireEvent.click(gameCell);
        expect(gameCell).toBeDisabled();
      }
    });

    it("shows a draw message when the game ends in a draw", async () => {
      const cells = screen
        .getAllByRole("button")
        .filter((cell) => cell.closest('[data-testid="game-board"]'));

      for (let i = 0; i < cells.length; i++) {
        if (i % 2 === 0) {
          fireEvent.click(cells[i]);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      await waitFor(
        () => {
          const drawElements = screen.getAllByText((content, element) => {
            return (
              content.includes("Draw") ||
              content.includes("draw") ||
              content.includes("It's a draw")
            );
          });
          expect(drawElements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it("resets the game when the restart button is clicked", () => {
      const cells = screen.getAllByRole("button");
      const gameCell = cells.find(
        (cell) =>
          cell.closest('[data-testid="game-board"]') && !cell.textContent
      );
      if (gameCell) {
        fireEvent.click(gameCell);
        const restartButton = screen.getByText(/Restart Game/i);
        fireEvent.click(restartButton);
        expect(gameCell).toHaveTextContent("");
      }
    });

    it("shows the winner when the game is won", async () => {
      const cells = screen
        .getAllByRole("button")
        .filter((cell) => cell.closest('[data-testid="game-board"]'));

      [0, 5, 10, 15, 20].forEach((index) => {
        fireEvent.click(cells[index]);
      });

      await waitFor(() => {
        expect(screen.getByText(/Player1, you win! 🎉/i)).toBeInTheDocument();
      });
    });
  });
});
