import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export type GameRecord = {
  playerName: string;
  moves: number;
  timeTaken: number;
  createdAt: Timestamp;
};

export const saveGameRecord = async (record: GameRecord) => {
  try {
    const ref = collection(db, "towerOfHanoi_records");
    const docRef = await addDoc(ref, {
      ...record,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving game record:", error);
  }
};
