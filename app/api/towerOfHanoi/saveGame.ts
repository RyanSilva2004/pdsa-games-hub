import { NextApiRequest, NextApiResponse } from "next";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";

export type GameRecord = {
  playerName: string;
  moves: number;
  timeTaken: number;
  createdAt: Timestamp;
};

export const saveGameRecord = async (record: Omit<GameRecord, 'createdAt'>) => {
  try {
    const ref = collection(firestore, "towerOfHanoi_records");
    const docRef = await addDoc(ref, {
      ...record,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving game record:", error);
    throw error;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { playerName, moves, timeTaken } = req.body;

      if (!playerName || typeof moves !== 'number' || typeof timeTaken !== 'number') {
        return res.status(400).json({ error: "Invalid request data" });
      }

      const gameRecord = {
        playerName,
        moves,
        timeTaken,
      };

      const recordId = await saveGameRecord(gameRecord);

      res.status(200).json({ message: "Game saved successfully", recordId });
    } catch (error: any) {
      console.error("Error in API handler:", error);
      res.status(500).json({ error: error.message || "Failed to save game" });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}