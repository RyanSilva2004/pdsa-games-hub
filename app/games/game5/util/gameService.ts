import { addDoc, collection } from "firebase/firestore";
import  {firestore} from "../../../../lib/firebase";

interface GameResult {
  playerName: string;
  status: "win" | "loss";
  timeTaken: number;
  moves: { row: number; col: number }[];
  algorithm: "backtracking" | "warnsdorff";
  timestamp: Date;
  
}

const saveGameResult = async (gameResult: GameResult) => {
  try {
    const docRef = await addDoc(collection(firestore, "gameResults"), {
      ...gameResult,
      
    });
    console.log("Game result saved with ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Error adding document: ", e);
    return false;
  }
};

export { saveGameResult, type GameResult };