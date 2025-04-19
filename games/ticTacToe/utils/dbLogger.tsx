import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
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

export async function getTopWinnersToday(level: "easy" | "hard") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const levelStrategy = level === "easy" ? "greedy" : "minimax";
  
    const q = query(
      collection(db, "TTT_playerWins"),
      where("strategy", "==", levelStrategy)
    );
  
    const querySnapshot = await getDocs(q);
    const todayWins: Record<string, number> = {};
  
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const winTime = data.timestamp?.toDate?.() || new Date(data.timestamp);
  
      if (winTime && new Date(winTime).setHours(0, 0, 0, 0) === today.getTime()) {
        const playerName = data.playerName || "Unknown";
        todayWins[playerName] = (todayWins[playerName] || 0) + 1;
      }
    });
  
    const sortedWinners = Object.entries(todayWins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  
    return sortedWinners.map(([name, wins]) => ({ name, wins }));
  }
