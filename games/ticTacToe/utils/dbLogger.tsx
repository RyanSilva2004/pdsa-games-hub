import { collection, addDoc } from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";

export async function savePlayerWinResult(data: any) {
  try {
    const resultToSave = {
        ...data,
        board: JSON.stringify(data.board), 
        playerMoves: JSON.stringify(data.playerMoves), 
      };
    await addDoc(collection(db, "TTT_playerWins"), resultToSave);
    console.log("Player win result saved successfully:", resultToSave);
  } catch (error) {
    console.error("Error saving player win result:", error);
  }
}

export async function saveGameWithComputerTiming(data: any) {
    try {
        const resultToSave = {
            ...data,
            board: JSON.stringify(data.board), 
          };
        await addDoc(collection(db, "TTT_computerGameResults"), resultToSave);
        console.log("Game result saved with computer timing successfully:", resultToSave);
      } catch (error) {
        console.error("Error saving game result:", error);
      }
}
