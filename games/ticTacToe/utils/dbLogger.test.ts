import {
  savePlayerWinResult,
  saveGameWithComputerTiming,
  getTopWinnersToday,
} from "./dbLogger";

import { collection, addDoc, getDocs, query } from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => "mocked-timestamp"),
  },
}));

describe("dbLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saves player win result", async () => {
    const mockData = {
      playerName: "Alice",
      board: [[]],
      playerMoves: [],
      strategy: "greedy",
    };
    await savePlayerWinResult(mockData);
    expect(addDoc).toHaveBeenCalled();
  });

  it("saves game with computer timing", async () => {
    const mockData = {
      board: [[]],
      duration: 1234,
    };
    await saveGameWithComputerTiming(mockData);
    expect(addDoc).toHaveBeenCalled();
  });

  it("returns top winners today", async () => {
    const mockDocs = [
      {
        data: () => ({
          timestamp: { toDate: () => new Date() },
          playerName: "Alice",
        }),
      },
      {
        data: () => ({
          timestamp: { toDate: () => new Date() },
          playerName: "Bob",
        }),
      },
      {
        data: () => ({
          timestamp: { toDate: () => new Date() },
          playerName: "Alice",
        }),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      forEach: (cb: any) => mockDocs.forEach(cb),
    });

    const result = await getTopWinnersToday("greedy");
    expect(result).toEqual([
      { name: "Alice", wins: 2 },
      { name: "Bob", wins: 1 },
    ]);
  });
});
