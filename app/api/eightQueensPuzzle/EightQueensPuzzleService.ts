import { firestore as db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";

export type Solution = {
  id: string;
  solution: string[];
  method: "sequential" | "threaded" | "comparison";
  timeTaken: number;
  foundBy: string;
  isRecognized: boolean;
  createdAt: Timestamp;
};

export const addGeneratedSolution = async (
  solution: string[],
  method: "sequential" | "threaded" | "comparison",
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
