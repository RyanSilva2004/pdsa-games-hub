import { gameStatusType, SolutionRecognition } from "@/app/types/gameEnums";
import { checkAndResetScoreboard, fetchScores, gameOver } from "../page";
import { getAllWinningMoves } from "@/app/api/eightQueensPuzzle/EightQueensPuzzleService";
import findAllNQueensSolutionsWithTime from "../utils/eightQueensSolver";

jest.mock("../../../api/eightQueensPuzzle/EightQueensPuzzleService", () => ({
  getAllWinningMoves: jest.fn(),
}));

describe("checkAndResetScoreboard", () => {
  const mockMoveWinnerToOldAndReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true and call moveWinnerToOldAndReset if all solutions are matched", async () => {
    const highestScores = [
      { status: "win", moves: ["0", "4", "7", "5", "2", "6", "1", "3"] },
      { status: "win", moves: ["0", "5", "7", "2", "6", "3", "1", "4"] },
    ];

    const getFilteredSolutions = jest.fn().mockResolvedValue({
      solution: ["0,4,7,5,2,6,1,3", "0,5,7,2,6,3,1,4"],
    });

    const result = await checkAndResetScoreboard(
      highestScores,
      getFilteredSolutions,
      mockMoveWinnerToOldAndReset
    );

    expect(result).toBe(true);
    expect(mockMoveWinnerToOldAndReset).toHaveBeenCalled();
  });

  it("should return false if not all solutions are matched", async () => {
    const highestScores = [
      { status: "win", moves: ["0", "4", "7", "5", "2", "6", "1", "3", "-1"] },
    ];

    const getFilteredSolutions = jest.fn().mockResolvedValue({
      solution: ["0,4,7,5,2,6,1,3", "0,5,7,2,6,3,1,4"],
    });

    const result = await checkAndResetScoreboard(
      highestScores,
      getFilteredSolutions,
      mockMoveWinnerToOldAndReset
    );

    expect(result).toBe(false);
    expect(mockMoveWinnerToOldAndReset).not.toHaveBeenCalled();
  });

  it("should return false if highestScores is empty", async () => {
    const highestScores: any[] = [];

    const getFilteredSolutions = jest.fn().mockResolvedValue({
      solution: ["0,4,7,5,2,6,1,3", "0,5,7,2,6,3,1,4"],
    });

    const result = await checkAndResetScoreboard(
      highestScores,
      getFilteredSolutions,
      mockMoveWinnerToOldAndReset
    );

    expect(result).toBe(false);
    expect(mockMoveWinnerToOldAndReset).not.toHaveBeenCalled();
  });

  it("should return false if getFilteredSolutions throws an error", async () => {
    const highestScores = [
      { status: "win", moves: ["0", "4", "7", "5", "2", "6", "1", "3", "-1"] },
    ];

    const getFilteredSolutions = jest
      .fn()
      .mockRejectedValue(new Error("DB Error"));

    const result = await checkAndResetScoreboard(
      highestScores,
      getFilteredSolutions,
      mockMoveWinnerToOldAndReset
    );

    expect(result).toBe(false);
    expect(mockMoveWinnerToOldAndReset).not.toHaveBeenCalled();
  });

  it("should ignore invalid user moves", async () => {
    const highestScores = [
      { status: "win", moves: null },
      { status: "win", moves: "not an array" },
      { status: "win", moves: ["0", "4", "7", "5", "2", "6", "1", "3"] },
    ];

    const getFilteredSolutions = jest.fn().mockResolvedValue({
      solution: ["0,4,7,5,2,6,1,3"],
    });

    const result = await checkAndResetScoreboard(
      highestScores,
      getFilteredSolutions,
      mockMoveWinnerToOldAndReset
    );

    expect(result).toBe(true);
    expect(mockMoveWinnerToOldAndReset).toHaveBeenCalled();
  });

  it("should return false if no solutions are returned by getFilteredSolutions", async () => {
    const highestScores = [
      { status: "win", moves: ["0", "4", "7", "5", "2", "6", "1", "3", "-1"] },
    ];

    const getFilteredSolutions = jest.fn().mockResolvedValue({
      solution: [],
    });

    const result = await checkAndResetScoreboard(
      highestScores,
      getFilteredSolutions,
      mockMoveWinnerToOldAndReset
    );

    expect(result).toBe(false);
    expect(mockMoveWinnerToOldAndReset).not.toHaveBeenCalled();
  });
});

describe("gameOver", () => {
  const mockSetIsGameEndingLoading = jest.fn();
  const mockSetIsModalOpen = jest.fn();
  const mockSetGameMessage = jest.fn();
  const mockSetError = jest.fn();
  const mockClearInterval = jest.spyOn(global, "clearInterval");
  const timerInterval = 12345 as unknown as NodeJS.Timeout;

  const options = {
    setIsGameEndingLoading: mockSetIsGameEndingLoading,
    setIsModalOpen: mockSetIsModalOpen,
    setGameMessage: mockSetGameMessage,
    setError: mockSetError,
    timerInterval: timerInterval,
  };

  const playerName = "TestPlayer";
  const elapsedTime = 100;
  const filteredMovesOfUser = jest.fn(() => [
    "0",
    "4",
    "7",
    "5",
    "2",
    "6",
    "1",
    "3",
  ]);
  const handleGamePlay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle winning with a unique solution", async () => {
    const isSolutionValidate = jest.fn().mockResolvedValue(false);

    await gameOver(
      8,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      0,
      options
    );

    expect(mockSetIsGameEndingLoading).toHaveBeenCalledWith(true);
    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
    expect(mockSetGameMessage).toHaveBeenCalledWith("You won!");
    expect(handleGamePlay).toHaveBeenCalledWith(
      expect.any(Array),
      SolutionRecognition.Unique,
      gameStatusType.WIN,
      playerName,
      elapsedTime
    );
    expect(mockSetIsGameEndingLoading).toHaveBeenCalledWith(false);
    expect(mockClearInterval).toHaveBeenCalledWith(timerInterval);
  });

  it("should handle winning with a known (duplicate) solution", async () => {
    const isSolutionValidate = jest.fn().mockResolvedValue(true);

    await gameOver(
      8,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      0,
      options
    );

    expect(mockSetGameMessage).toHaveBeenCalledWith(
      "This solution already exists!"
    );
    expect(handleGamePlay).toHaveBeenCalledWith(
      expect.any(Array),
      SolutionRecognition.Known,
      gameStatusType.WIN,
      playerName,
      elapsedTime
    );
  });

  it("should handle solution validation error (isSolutionValidate returns null)", async () => {
    const isSolutionValidate = jest.fn().mockResolvedValue(null);

    await gameOver(
      8,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      0,
      options
    );

    expect(mockSetGameMessage).toHaveBeenCalledWith(
      "You have successfully solved the puzzle. However, an issue occurred during the game-winning validation. Please reload the page to see your name appear on the leaderboard."
    );
  });

  it("should handle losing when not all queens are placed but slots are empty", async () => {
    const isSolutionValidate = jest.fn();
    await gameOver(
      6,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      0,
      options
    );

    expect(handleGamePlay).toHaveBeenCalledWith(
      expect.any(Array),
      SolutionRecognition.Variation,
      gameStatusType.LOST,
      playerName,
      elapsedTime
    );
    expect(mockSetGameMessage).toHaveBeenCalledWith(
      "Game over! Give it another try!"
    );
  });

  it("should handle losing when one move left", async () => {
    const isSolutionValidate = jest.fn();

    await gameOver(
      7,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      1,
      options
    );

    expect(mockSetGameMessage).toHaveBeenCalledWith(
      "Game over! So close! Only one move left."
    );
  });

  it("should handle losing when multiple empty slots left", async () => {
    const isSolutionValidate = jest.fn();

    await gameOver(
      5,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      3,
      options
    );

    expect(mockSetGameMessage).toHaveBeenCalledWith(
      "Game over! You are out of moves."
    );
  });

  it("should catch error from handleGamePlay in WIN case", async () => {
    const isSolutionValidate = jest.fn().mockResolvedValue(false);
    handleGamePlay.mockRejectedValueOnce("Save failed");

    await gameOver(
      8,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      0,
      options
    );

    expect(mockSetError).toHaveBeenCalledWith({
      header: "Error in save Game",
      description: "Save failed",
    });
  });

  it("should catch error from handleGamePlay in LOST case", async () => {
    const isSolutionValidate = jest.fn();
    handleGamePlay.mockRejectedValueOnce("Save failed");

    await gameOver(
      5,
      playerName,
      elapsedTime,
      filteredMovesOfUser,
      isSolutionValidate,
      handleGamePlay,
      2,
      options
    );

    expect(mockSetError).toHaveBeenCalledWith({
      header: "Error in save Game",
      description: "Save failed",
    });
  });
});

describe("fetchScores", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and sort unique solutions", async () => {
    const mockScores = [
      { status: "win", solutionType: "unique", time: 100, userName: "Player1" },
      { status: "win", solutionType: "known", time: 200, userName: "Player2" },
      { status: "win", solutionType: "unique", time: 50, userName: "Player3" },
    ];

    (getAllWinningMoves as jest.Mock).mockResolvedValue(mockScores);

    const result = await fetchScores();

    expect(result).toEqual([
      { status: "win", solutionType: "unique", time: 50, userName: "Player3" },
      { status: "win", solutionType: "unique", time: 100, userName: "Player1" },
    ]);
    expect(getAllWinningMoves).toHaveBeenCalled();
  });

  it("should return an empty array if no unique solutions are found", async () => {
    const mockScores = [
      { status: "win", solutionType: "known", time: 200, userName: "Player2" },
    ];

    (getAllWinningMoves as jest.Mock).mockResolvedValue(mockScores);

    const result = await fetchScores();

    expect(result).toEqual([]);
    expect(getAllWinningMoves).toHaveBeenCalled();
  });

  it("should throw an error if getAllWinningMoves fails", async () => {
    (getAllWinningMoves as jest.Mock).mockRejectedValue(
      new Error("Database Error")
    );

    await expect(fetchScores()).rejects.toEqual({
      header: "Error in Fetching Score Board",
      description: new Error("Database Error"),
    });
    expect(getAllWinningMoves).toHaveBeenCalled();
  });
});

describe("findAllNQueensSolutionsWithTime", () => {
  it("should find 2 solutions for 4-queens", () => {
    const { results, timeTaken } = findAllNQueensSolutionsWithTime(4);

    expect(results.length).toBe(2);
    results.forEach((solution) => {
      expect(solution.length).toBe(4);
    });
    expect(typeof timeTaken).toBe("number");
    expect(timeTaken).toBeGreaterThanOrEqual(0);
  });

  it("should find 1 solution for 1-queen", () => {
    const { results } = findAllNQueensSolutionsWithTime(1);
    expect(results.length).toBe(1);
    expect(results[0]).toEqual([0]);
  });

  it("should find 0 solutions for 2-queens", () => {
    const { results } = findAllNQueensSolutionsWithTime(2);
    expect(results.length).toBe(0);
  });

  it("should find 0 solutions for 3-queens", () => {
    const { results } = findAllNQueensSolutionsWithTime(3);
    expect(results.length).toBe(0);
  });

  it("should produce solutions with correct size for each n", () => {
    for (let n = 1; n <= 5; n++) {
      const { results } = findAllNQueensSolutionsWithTime(n);
      results.forEach((solution) => {
        expect(solution.length).toBe(n);
      });
    }
  });
});

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postedMessage: any;

  constructor(stringUrl: string | URL, options?: WorkerOptions) {
    setTimeout(() => {
      const n = this.postedMessage?.n;
      const results: number[][] = [];
      if (n > 6) {
        const numSolutions = Math.max(10, Math.floor(Math.random() * 50));
        for (let i = 0; i < numSolutions; i++) {
          results.push(Array(n).fill(i));
        }
      }
      if (this.onmessage) {
        this.onmessage({ data: results } as MessageEvent);
      }
    }, 50);
  }

  postMessage(message: any): void {
    this.postedMessage = message;
  }

  terminate(): void {}
}
(global as any).Worker = MockWorker;
describe("Performance Comparison: Sequential vs. Threaded", () => {
  it("should compare execution time for a larger board size (n=12)", async () => {
    const n = 12;

    const startSequential = performance.now();
    const sequentialResult = findAllNQueensSolutionsWithTime(n);
    const endSequential = performance.now();
    const timeSequential = endSequential - startSequential;
    console.log(`Sequential (n=${n}): ${timeSequential.toFixed(2)} ms`);
    console.log(
      `Sequential (n=${n}) found ${sequentialResult.results.length} solutions.`
    );

    const startThreaded = performance.now();
    const worker = new Worker(
      new URL("../utils/workerThread", import.meta.url)
    );
    worker.postMessage({ n });

    const threadedResultsPromise = new Promise<number[][]>((resolve) => {
      worker.onmessage = (e) => {
        const workerResults: number[][] = e.data;
        resolve(workerResults);
        worker.terminate();
      };
    });

    const threadedResults = await threadedResultsPromise;
    const endThreaded = performance.now();
    const timeThreaded = endThreaded - startThreaded;
    console.log(`Threaded (n=${n}): ${timeThreaded.toFixed(2)} ms`);
    console.log(
      `Threaded (n=${n}) simulated finding ${threadedResults.length} solutions.`
    );
  }, 15000);
});
