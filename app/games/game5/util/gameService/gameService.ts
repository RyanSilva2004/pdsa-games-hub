import { addDoc, collection } from "firebase/firestore";
import  {firestore} from "../../../../../lib/firebase";

interface GameResult {
  playerName: string;
  status: "win" | "loss";
  timeTaken: number;
  moves: { row: number; col: number }[];
  algorithm: "backtracking" | "warnsdorff";
  timestamp: Date;

}

const validateGameResult = (result: GameResult): string | null => {
  if (!result.playerName || result.playerName.length > 20) {
    return "Invalid player name";
  }
  
  if (!["win", "loss"].includes(result.status)) {
    return "Invalid game status";
  }
  
  if (typeof result.timeTaken !== "number" || result.timeTaken < 0) {
    return "Invalid time taken";
  }
  
  if (!Array.isArray(result.moves)) {
    return "Invalid moves data";
  }
  
  if (!["backtracking", "warnsdorff"].includes(result.algorithm)) {
    return "Invalid algorithm";
  }
  

  
  return null;
};

const saveGameResult = async (gameResult: GameResult) => {
  const validationError = validateGameResult(gameResult);
  if (validationError) {
    console.error("Validation failed:", validationError);
    throw new Error(validationError);
  }

  try {
    const docRef = await addDoc(collection(firestore, "gameResults"), {
      ...gameResult,
      timestamp: new Date(),
    });
    console.log("Game result saved with ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Failed to save game result to database");
  }
};

export { saveGameResult, type GameResult };