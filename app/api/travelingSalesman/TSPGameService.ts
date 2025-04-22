import { firestore } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { TSPResult } from "@/games/game2/logic/route-algorithms";

/**
 * Interface for algorithm performance data to be stored in Firebase
 */
export interface AlgorithmPerformanceRecord {
  algorithmName: string;
  executionTime: number;
  distance: number;
  foundOptimal: boolean;
  gameRound: number;
}

/**
 * Interface for TSP game data to be stored in Firebase
 */
export interface TSPGameRecord {
  playerName: string;
  homeCity: string;
  selectedCities: string[];
  optimalRoute: string[];
  optimalDistance: number;
  timestamp: any; // Firestore timestamp
  correct: boolean; // Whether player found the optimal solution
  playerDistance: number;
  gameRound: number; // To track game rounds for the player
}

/**
 * Service class for interacting with Firebase for the Traveling Salesman Game
 */
export class TSPGameService {
  /**
   * Save a completed game to Firestore
   * 
   * @param gameData The game data to save
   * @returns Promise resolving to the document ID
   */
  async saveGameResult(gameData: Omit<TSPGameRecord, "timestamp">): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, "tspGameResults"), {
        ...gameData,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving game result:", error);
      throw error;
    }
  }

  /**
   * Get algorithm performance data for the last 10 game rounds
   * 
   * @returns Promise resolving to algorithm performance records
   */
  async getAlgorithmPerformanceData(): Promise<AlgorithmPerformanceRecord[]> {
    try {
      const q = query(
        collection(firestore, "tspAlgorithmPerformance"),
        orderBy("gameRound", "desc"),
        limit(30) // Get last 10 games x 3 algorithms = 30 records
      );
      
      const querySnapshot = await getDocs(q);
      const performanceData: AlgorithmPerformanceRecord[] = [];
      
      querySnapshot.forEach(doc => {
        performanceData.push(doc.data() as AlgorithmPerformanceRecord);
      });
      
      return performanceData;
    } catch (error) {
      console.error("Error getting algorithm performance data:", error);
      throw error;
    }
  }

  /**
   * Get the latest game round number
   * 
   * @returns Promise resolving to the latest game round number
   */
  async getLatestGameRound(): Promise<number> {
    try {
      const q = query(
        collection(firestore, "tspGameResults"),
        orderBy("gameRound", "desc"),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 0; // No games played yet
      }
      
      const latestGame = querySnapshot.docs[0].data() as TSPGameRecord;
      return latestGame.gameRound;
    } catch (error) {
      console.error("Error getting latest game round:", error);
      return 0; // Default to 0 if error
    }
  }
}