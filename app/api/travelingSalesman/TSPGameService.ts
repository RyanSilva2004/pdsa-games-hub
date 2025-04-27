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

export interface AlgorithmPerformanceRecord {
  algorithmName: string;
  executionTime: number;
  distance: number;
  foundOptimal: boolean;
  gameRound: number;
}


export interface GroupedAlgorithmPerformance {
  algorithms: {
    name: string;
    executionTime: number;
    distance: number;
  }[];
  gameRound: number;
  timestamp: any;
}


export interface TSPGameRecord {
  playerName: string;
  homeCity: string;
  selectedCities: string[];
  optimalRoute: string[];
  optimalDistance: number;
  timestamp: any; 
  correct: boolean; 
  playerDistance: number;
  gameRound: number; 
}


export class TSPGameService {

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


  async saveAlgorithmPerformance(
    results: TSPResult[],
    gameRound: number
  ): Promise<string> {
    try {
      // Format the data for Firestore
      const algorithmData: GroupedAlgorithmPerformance = {
        algorithms: results.map(result => ({
          name: result.algorithmName,
          executionTime: result.executionTime,
          distance: result.distance
        })),
        gameRound,
        timestamp: serverTimestamp()
      };

      // Save to Firestore
      const docRef = await addDoc(
        collection(firestore, "tspAlgorithmPerformance"), 
        algorithmData
      );
      
      return docRef.id;
    } catch (error) {
      console.error("Error saving algorithm performance:", error);
      throw error;
    }
  }

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