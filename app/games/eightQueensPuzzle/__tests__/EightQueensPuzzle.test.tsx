import { checkAndResetScoreboard } from "../page";

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
