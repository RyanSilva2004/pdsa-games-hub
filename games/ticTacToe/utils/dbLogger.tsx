import { collection, addDoc } from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";

export async function savePlayerWinResult(data: any) {
  try {
    const resultToSave = {
        ...data,
        board: JSON.stringify(data.board), 
        playerMoves: JSON.stringify(data.playerMoves), 
      };
    await addDoc(collection(db, "playerWins"), resultToSave);
    console.log("Player win result saved successfully:", resultToSave);
  } catch (error) {
    console.error("Error saving player win result:", error);
  }
}

export async function saveGameWithComputerTiming(data: any) {
  
}
