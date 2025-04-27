

import { AdjacencyMatrix } from "./adjacency-matrix";
import { TSPGameService } from "@/app/api/travelingSalesman/TSPGameService";


const gameService = new TSPGameService();


export interface TSPResult {
  route: string[];
  distance: number;
  executionTime: number; // Time in milliseconds
  algorithmName: string;
}


export function nearestNeighborAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): TSPResult {
  const startTime = performance.now(); const allCities = adjacencyMatrix.getCityIds();
  const route: string[] = [startCity]; let totalDistance = 0; let currentCity = startCity;
  
  const mandatoryToVisit = new Set(mandatoryCities.filter(city => city !== startCity));
   const unvisited = new Set(allCities.filter(city => city !== startCity));
  
  while (mandatoryToVisit.size > 0) {
    let nearestCity = "";
    let minDistance = Infinity;
    
    for (const city of unvisited) {
      const distance = adjacencyMatrix.getDistance(currentCity, city);
      
      if (mandatoryToVisit.has(city)) {
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city;
        }
      } else if (mandatoryToVisit.size === 0 && distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }
    
    route.push(nearestCity);
    totalDistance += minDistance;
    currentCity = nearestCity;
    unvisited.delete(nearestCity);
    mandatoryToVisit.delete(nearestCity);
  }
  
  totalDistance += adjacencyMatrix.getDistance(currentCity, startCity);
  route.push(startCity);
  const endTime = performance.now();
  const executionTime = Math.max(0.01, Math.abs(endTime - startTime));
  
  return { route, distance: totalDistance,executionTime,algorithmName: "Nearest Neighbor" };
}


export function bruteForceAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): TSPResult {
  const startTime = performance.now();
  const citiesToPermute = mandatoryCities.filter(city => city !== startCity);
  const permutations = generatePermutations(citiesToPermute);
  
  let bestRoute: string[] = [];
  let bestDistance = Infinity;
  
  for (const permutation of permutations) {
    const route = [startCity, ...permutation, startCity];
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += adjacencyMatrix.getDistance(route[i], route[i + 1]);
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      bestRoute = [...route];
    }
  }

  const endTime = performance.now();
  const executionTime = Math.max(0.01, endTime - startTime);
  
  return { route: bestRoute, distance: bestDistance, executionTime,algorithmName: "Brute Force" };
}

/// Generate all permutations for brute force algorithm
function generatePermutations<T>(elements: T[]): T[][] {
  // Base case: 1 or 0 elements
  if (elements.length <= 1) {
    return [elements];
  }
  const result: T[][] = [];
  
  for (let i = 0; i < elements.length; i++) {
    const current = elements[i];
    const remaining = elements.slice(0, i).concat(elements.slice(i + 1));
    const remainingPermutations = generatePermutations(remaining);
    for (const permutation of remainingPermutations) {
      result.push([current, ...permutation]);
    }
  }
  
  return result;
}


export function branchAndBoundAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): TSPResult {
  const startTime = performance.now();
  const citiesToVisit = mandatoryCities.filter(city => city !== startCity);
  let globalBestRoute: string[] = [];
  let globalBestDistance = Infinity;
  const visited = new Set<string>([startCity]);
  const currentPath = [startCity];
  let currentDistance = 0;
  

  branchAndBoundHelper( adjacencyMatrix,startCity,currentPath,currentDistance,visited,citiesToVisit,
    (route, distance) => {
      if (distance < globalBestDistance) {
        globalBestDistance = distance;
        globalBestRoute = [...route];
      }
    }
  );
  
  const endTime = performance.now();
  const executionTime = Math.max(0.01, endTime - startTime);
  
  return {route: globalBestRoute, distance: globalBestDistance,executionTime,algorithmName: "Branch and Bound"};
}


/// Recursive helper function for branch and bound algorithm
function branchAndBoundHelper(
 adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  currentPath: string[],
  currentDistance: number,
  visited: Set<string>,
  mandatoryCities: string[],
  updateBest: (route: string[], distance: number) => void
): void {
  const allVisited = mandatoryCities.every(city => visited.has(city));
  
  if (allVisited) {
    const lastCity = currentPath[currentPath.length - 1];
    const returnDistance = adjacencyMatrix.getDistance(lastCity, startCity);
    const totalDistance = currentDistance + returnDistance;
    updateBest([...currentPath, startCity], totalDistance);
    return;
  }
  
  const lastCity = currentPath[currentPath.length - 1];
  for (const nextCity of mandatoryCities) {
    if (!visited.has(nextCity)) {
      // Calculate distance to this city
      const distance = adjacencyMatrix.getDistance(lastCity, nextCity);
      const newDistance = currentDistance + distance;
      
      // Skip this branch if we're already worse than the best known solution
      // This is the "bound" part of branch and bound
      if (globalLowerBound(adjacencyMatrix, newDistance, currentPath.length, mandatoryCities.length) >= Infinity) {
        continue;
      }
      
      visited.add(nextCity);
      currentPath.push(nextCity);

      branchAndBoundHelper(adjacencyMatrix,startCity,currentPath,newDistance, visited,mandatoryCities,updateBest
      );
      
      // Backtrack: remove city from path and mark as unvisited
      currentPath.pop();
      visited.delete(nextCity);
    }
  }
}

/**
 * Simple lower bound estimation function for branch and bound
 * This can be improved with more sophisticated bounds
 */
function globalLowerBound(
  adjacencyMatrix: AdjacencyMatrix,
  currentDistance: number,
  visitedCount: number,
  totalCities: number
): number {
  // This is a placeholder for a more sophisticated lower bound
  // A real implementation would calculate a true lower bound on the remaining distance
  return currentDistance;
}

/**
 * Run all TSP algorithms and return all results
 */
export async function runAllTspAlgorithms(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[],
  gameRound?: number
): Promise<TSPResult[]> {

  let results: TSPResult[] = [];
  
  // Always run nearest neighbor (fast for any size)
  results.push(nearestNeighborAlgorithm(adjacencyMatrix, startCity, mandatoryCities));
  
  // Run branch and bound (recursive approach)
  results.push(branchAndBoundAlgorithm(adjacencyMatrix, startCity, mandatoryCities));
  
  // Run bruteforce (recursive approach)
  results.push(bruteForceAlgorithm(adjacencyMatrix, startCity, mandatoryCities));
 
  // Save algorithm performance data to database if gameRound is provided
  if (gameRound !== undefined) {
    try {
      await gameService.saveAlgorithmPerformance(results, gameRound);
      console.log("Algorithm performance saved successfully to Firestore!");
    } catch (error) {
      console.error("Error saving algorithm performance:", error);
    }
  }

  return results;
}

/**
 * Get the optimal solution from all algorithm results
 */
export function getOptimalSolution(results: TSPResult[]): TSPResult {
  return results.reduce((best, current) => {
    // Skip solutions that haven't produced valid routes
    if (current.route.length === 0 || current.distance === Infinity) {
      return best;
    }
    
    return current.distance < best.distance ? current : best;
  }, results[0]);
}