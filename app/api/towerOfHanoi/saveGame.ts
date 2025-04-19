import { NextApiRequest, NextApiResponse } from "next";
import { saveGameRecord } from "../../../app/api/towerOfHanoi/towerOfHanoiService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { playerName, moves, timeTaken } = req.body;

      const gameRecord = {
        playerName,
        moves,
        timeTaken,
        createdAt: new Date(),
      };

      const recordId = await saveGameRecord(gameRecord);

      res.status(200).json({ message: "Game saved successfully", recordId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
