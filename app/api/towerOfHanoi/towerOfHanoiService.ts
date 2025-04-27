import { collection, addDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export type GameRecord = {
  playerName: string;
  moves: number;
  timeTaken: number;
  createdAt: Timestamp;
};

export const saveGameRecord = async (record: Omit<GameRecord, 'createdAt'>) => {
  try {
    console.log("Attempting to save record:", record);
    
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }

    const ref = collection(firestore, "towerOfHanoi_records");

    // Debugging the ref object
    console.log("Firestore reference:", ref);

    const docRef = await addDoc(ref, {
      ...record,
      createdAt: Timestamp.now(),
    });

    console.log("Document written with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving game record:", error);
    throw error;
  }
};
