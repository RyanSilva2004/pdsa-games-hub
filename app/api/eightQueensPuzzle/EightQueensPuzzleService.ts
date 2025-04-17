import { firestore as db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";

type Solution = {
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
  const ref = collection(db, "solutions");
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
  const ref = collection(db, "solutions");
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
