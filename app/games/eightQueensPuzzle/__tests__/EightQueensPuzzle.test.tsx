import {
  gameStatusType,
  SolutionRecognition,
  solutionTypes,
} from "@/app/types/gameEnums";
import {
  checkAndResetScoreboard,
  fetchScores,
  gameOver,
  handleGamePlay,
} from "../page";
import { userType } from "@/app/types/userEnums";

describe("checkAndResetScoreboard", () => {
  it("should call moveWinnerToOldAndReset if all trimmed solutions match", async () => {
    const highestScoresMock = [
      { status: "win", moves: ["1", "2", "3", "END"] },
      { status: "win", moves: ["4", "5", "6", "END"] },
    ];

    const getFilteredSolutionsMock = jest.fn().mockResolvedValue({
      solution: ["1,2,3,END", "4,5,6,END"],
    });

    const moveWinnerToOldAndResetMock = jest.fn().mockResolvedValue(undefined);

    const result = await checkAndResetScoreboard(
      highestScoresMock,
      getFilteredSolutionsMock,
      moveWinnerToOldAndResetMock
    );

    expect(moveWinnerToOldAndResetMock).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("should not call moveWinnerToOldAndReset if not all solutions match", async () => {
    const highestScoresMock = [
      { status: "win", moves: ["1", "2", "3", "END"] },
    ];

    const getFilteredSolutionsMock = jest.fn().mockResolvedValue({
      solution: ["6,2,3,END"],
    });

    const moveWinnerToOldAndResetMock = jest.fn();

    const result = await checkAndResetScoreboard(
      highestScoresMock,
      getFilteredSolutionsMock,
      moveWinnerToOldAndResetMock
    );

    expect(moveWinnerToOldAndResetMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});

describe("handleGamePlay", () => {
  let mockSaveGamePlay: jest.Mock;

  beforeEach(() => {
    mockSaveGamePlay = jest.fn();
  });

  it("should call saveGamePlay with correct parameters for a win", async () => {
    const finalMoves = ["1", "2", "3"];
    const solutionType = SolutionRecognition.Unique;
    const gameStatus = gameStatusType.WIN;
    const playerName = "DilshanWin";
    const elapsedTime = 1200;

    await handleGamePlay(
      finalMoves,
      solutionType,
      gameStatus,
      playerName,
      elapsedTime
    );

    expect(mockSaveGamePlay).toHaveBeenCalledWith(
      expect.any(String),
      finalMoves,
      solutionTypes.GAME_PLAY,
      expect.any(Number),
      gameStatus,
      userType.GUEST_USER,
      solutionType
    );
  });

  it("should call saveGamePlay with correct parameters for a loss", async () => {
    const finalMoves = ["1", "2", "3"];
    const solutionType = SolutionRecognition.Variation;
    const gameStatus = gameStatusType.LOST;
    const playerName = "DilshanLost";
    const elapsedTime = 5000;

    await handleGamePlay(
      finalMoves,
      solutionType,
      gameStatus,
      playerName,
      elapsedTime
    );

    expect(mockSaveGamePlay).toHaveBeenCalledWith(
      expect.any(String),
      finalMoves,
      solutionTypes.GAME_PLAY,
      expect.any(Number),
      gameStatus,
      userType.GUEST_USER,
      solutionType
    );
  });

  it("should handle errors in saveGamePlay", async () => {
    mockSaveGamePlay.mockRejectedValueOnce(new Error("Save failed"));

    const finalMoves = ["1", "2", "3"];
    const solutionType = SolutionRecognition.Unique;
    const gameStatus = gameStatusType.WIN;
    const playerName = "DilshanSaveField";
    const elapsedTime = 666;

    await expect(
      handleGamePlay(
        finalMoves,
        solutionType,
        gameStatus,
        playerName,
        elapsedTime
      )
    ).resolves.toBeUndefined();
    expect(mockSaveGamePlay).toHaveBeenCalled();
  });
});

describe("gameOver", () => {
  let mockIsSolutionValidate: jest.Mock;
  let mockHandleGamePlay: jest.Mock;
  let mockSetIsModalOpen: jest.Mock;
  let mockSetGameMessage: jest.Mock;
  let mockClearInterval: jest.Mock;

  beforeEach(() => {
    mockIsSolutionValidate = jest.fn();
    mockHandleGamePlay = jest.fn();
    mockSetIsModalOpen = jest.fn();
    mockSetGameMessage = jest.fn();
    mockClearInterval = jest.fn();
  });

  it("should set modal open and message for a win", async () => {
    mockIsSolutionValidate.mockResolvedValue(true);

    const timerInterval: NodeJS.Timeout | null = setTimeout(() => {}, 1000);

    await gameOver(
      8,
      "player1",
      100,
      mockSetIsModalOpen,
      mockSetGameMessage,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      mockIsSolutionValidate,
      mockHandleGamePlay,
      jest.fn(),
      timerInterval
    );

    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
    expect(mockSetGameMessage).toHaveBeenCalledWith("You won!");
    expect(mockHandleGamePlay).toHaveBeenCalledWith(
      expect.any(Array),
      SolutionRecognition.Known,
      gameStatusType.WIN,
      "player1",
      100
    );
    expect(mockClearInterval).toHaveBeenCalledWith(timerInterval);
  });

  it("should set modal open and message for a loss", async () => {
    mockIsSolutionValidate.mockResolvedValue(false);

    const timerInterval: NodeJS.Timeout | null = setTimeout(() => {}, 1000);

    await gameOver(
      8,
      "player1",
      100,
      mockSetIsModalOpen,
      mockSetGameMessage,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      mockIsSolutionValidate,
      mockHandleGamePlay,
      jest.fn(),
      timerInterval
    );

    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
    expect(mockSetGameMessage).toHaveBeenCalledWith("You won!");
    expect(mockHandleGamePlay).toHaveBeenCalledWith(
      expect.any(Array),
      SolutionRecognition.Unique,
      gameStatusType.WIN,
      "player1",
      100
    );
    expect(mockClearInterval).toHaveBeenCalledWith(timerInterval);
  });

  it("should set modal open with 'game over' message if no moves left", async () => {
    const timerInterval: NodeJS.Timeout | null = null;

    await gameOver(
      8,
      "player1",
      100,
      mockSetIsModalOpen,
      mockSetGameMessage,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      mockIsSolutionValidate,
      mockHandleGamePlay,
      jest.fn(),
      timerInterval
    );

    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
    expect(mockSetGameMessage).toHaveBeenCalledWith(
      "Game over! You are out of moves."
    );
    expect(mockClearInterval).not.toHaveBeenCalled();
  });
  it("should set modal open with 'So close' message for 1 move left", async () => {
    const timerInterval: NodeJS.Timeout | null = null;

    await gameOver(
      7,
      "player1",
      100,
      mockSetIsModalOpen,
      mockSetGameMessage,
      jest.fn(),
      jest.fn(),
      jest.fn(),
      mockIsSolutionValidate,
      mockHandleGamePlay,
      jest.fn(),
      timerInterval
    );

    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
    expect(mockSetGameMessage).toHaveBeenCalledWith(
      "Game over! So close! Only one move left."
    );
    expect(mockClearInterval).not.toHaveBeenCalled();
  });
});

describe("fetchScores", () => {
  let mockGetAllWinningMoves: jest.Mock;

  beforeEach(() => {
    mockGetAllWinningMoves = jest.fn();
  });

  it("should fetch and sort winning scores correctly", async () => {
    mockGetAllWinningMoves.mockResolvedValue([
      { status: "win", time: 100 },
      { status: "win", time: 50 },
    ]);

    const setHighestScores = await fetchScores();

    expect(mockGetAllWinningMoves).toHaveBeenCalled();
    expect(setHighestScores).toHaveBeenCalledWith([
      { status: "win", time: 50 },
      { status: "win", time: 100 },
    ]);
  });

  it("should handle errors while fetching scores", async () => {
    mockGetAllWinningMoves.mockRejectedValueOnce(new Error("Failed to fetch"));
    let setError;
    try {
      await fetchScores();
    } catch (e) {
      setError = { header: "Error in Fetching Score Board", description: e };
    }

    expect(setError).toHaveBeenCalledWith({
      header: "Error in Fetching Score Board",
      description: new Error("Failed to fetch"),
    });
  });
});
