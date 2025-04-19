import { collection, addDoc, Timestamp } from "firebase/firestore";
import { firestore } from "../../../lib/firebase";  // Corrected import

export type GameRecord = {
  playerName: string;
  moves: number;
  timeTaken: number;
  createdAt: Timestamp;
};

export const saveGameRecord = async (record: GameRecord) => {
  try {
    const ref = collection(firestore, "towerOfHanoi_records");
    const docRef = await addDoc(ref, {
      ...record,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving game record:", error);
  }
};
