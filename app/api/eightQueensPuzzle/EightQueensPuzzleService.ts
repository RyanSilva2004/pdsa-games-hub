import {
  gameStatusType,
  SolutionRecognition,
  solutionTypes,
} from "@/app/types/gameEnums";
import { firestore as db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { userType } from "@/app/types/userEnums";

export type Solution = {
  id: string;
  solution: string[];
  method: solutionTypes;
  timeTaken: number;
  foundBy?: string;
  isRecognized?: boolean;
  createdAt?: Timestamp;
};

export type ScoreEntry = {
  name: string;
  time: number;
  date: string;
  status: string;
  moves: string[];
};

export const addGeneratedSolution = async (
  solution: string[],
  method: solutionTypes,
  timeTaken: number
) => {
  console.log("Saving to Firestore:", { solution, method, timeTaken });
  const ref = collection(db, "8Queens_solutions");
  const docRef = await addDoc(ref, {
    solution,
    method,
    timeTaken,
    foundBy: "system",
    isRecognized: false,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};

export const getAllSolutions = async (): Promise<Solution[]> => {
  const ref = collection(db, "8Queens_solutions");
  const snapshot = await getDocs(ref);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Solution;

    const { id, ...solutionData } = data;

    return {
      id: doc.id,
      ...solutionData,
    };
  });
};

export const deleteSolution = async (id: string): Promise<void> => {
  console.log(`Deleting ID: ${id}`);

  const docRef = doc(db, "8Queens_solutions", id);
  await deleteDoc(docRef);

  console.log(`${id} deleted successfully.`);
};

export const saveGamePlay = async (
  userName: string,
  moves: string[],
  method: solutionTypes,
  timeTaken: number,
  status: gameStatusType,
  userType: userType,
  solutionType?: SolutionRecognition
) => {
  console.log("Saving to Firestore:", { userName, moves, method, timeTaken });

  const ref = collection(db, "8Queens_GameWinners");

  const docRef = await addDoc(ref, {
    userName,
    moves,
    method,
    timeTaken,
    foundBy: "system",
    isRecognized: false,
    datePlayed: new Date().toLocaleDateString(),
    createdAt: Timestamp.now(),
    status,
    userType,
    solutionType,
  });

  return docRef.id;
};

export const getAllWinningMoves = async (): Promise<ScoreEntry[]> => {
  const ref = collection(db, "8Queens_GameWinners");
  const querySnapshot = await getDocs(ref);

  const scores: ScoreEntry[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    if (
      Array.isArray(data.moves) &&
      typeof data.userName === "string" &&
      typeof data.timeTaken === "number" &&
      typeof data.status === "string"
    ) {
      scores.push({
        name: data.userName,
        time: data.timeTaken,
        date: data.datePlayed ?? "",
        status: data.status,
        moves: data.moves,
      });
    }
  });

  return scores;
};

export const moveWinnerToOldAndReset = async () => {
  const ref = collection(db, "8Queens_GameWinners");
  const oldRef = collection(db, "8Queens_OldWinners");
  const snapshot = await getDocs(ref);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    await addDoc(oldRef, {
      ...data,
      movedAt: Timestamp.now(),
    });

    await deleteDoc(doc(ref, docSnap.id));
  }
};
