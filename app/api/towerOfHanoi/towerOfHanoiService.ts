import { collection, addDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export type GameRecord = {
  playerName: string;
  moves: number;
  timeTaken: number;
  moveSequence: string[];
  numDisks: number;
  isFourPegs: boolean;
  
  usedAlgorithm: string | null;
  createdAt: Timestamp;
};

export type AlgorithmRecord = {
  playerName: string;
  algorithm: string;
  time: number;
  numDisks: number;
  isFourPegs: boolean;
  createdAt: Timestamp;
};

export const saveGameRecord = async (record: Omit<GameRecord, 'createdAt'>) => {
  try {
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }

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

export const saveAlgorithmTime = async (record: Omit<AlgorithmRecord, 'createdAt'>) => {
  try {
    if (!firestore) {
      throw new Error("Firestore not initialized");
    }

    const ref = collection(firestore, "towerOfHanoi_algorithm_times");
    const docRef = await addDoc(ref, {
      ...record,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error saving algorithm time:", error);
    throw error;
  }
};