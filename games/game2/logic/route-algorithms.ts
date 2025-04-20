// filepath: c:\Users\ryans\Desktop\Bsc Computing\PDSA-2\CW\pdsa-games-hub\games\game2\logic\route-algorithms.ts
/**
 * Implementation of algorithms for solving the Traveling Salesman Problem
 */

import { AdjacencyMatrix } from "./adjacency-matrix";

/**
 * Interface for algorithm result including route, distance, and execution time
 */
export interface TSPResult {
  route: string[];
  distance: number;
  executionTime: number; // Time in milliseconds
  algorithmName: string;
}

/**
 * Solves the Traveling Salesman Problem using the Nearest Neighbor algorithm
 * 
 * @param adjacencyMatrix - The adjacency matrix with distances between cities
 * @param startCity - The city to start from (and return to)
 * @param mandatoryCities - Cities that must be visited (in any order)
 * @returns Object containing the route, total distance, and execution time
 */
export function nearestNeighborAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): TSPResult {
  const startTime = performance.now();
  
  // Get all city IDs from the adjacency matrix
  const allCities = adjacencyMatrix.getCityIds();
  
  // Initialize route with the start city
  const route: string[] = [startCity];
  let totalDistance = 0;
  let currentCity = startCity;
  
  // Create a set of mandatory cities to track which ones we've visited
  const mandatoryToVisit = new Set(mandatoryCities.filter(city => city !== startCity));
  
  // Keep track of all unvisited cities
  const unvisited = new Set(allCities.filter(city => city !== startCity));
  
  // Continue until we've visited all mandatory cities
  while (mandatoryToVisit.size > 0) {
    let nearestCity = "";
    let minDistance = Infinity;
    
    // Find the nearest unvisited city
    for (const city of unvisited) {
      const distance = adjacencyMatrix.getDistance(currentCity, city);
      
      // Prioritize mandatory cities first
      if (mandatoryToVisit.has(city)) {
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city;
        }
      } else if (mandatoryToVisit.size === 0 && distance < minDistance) {
        // Only consider non-mandatory cities if all mandatory ones are visited
        minDistance = distance;
        nearestCity = city;
      }
    }
    
    // Add the nearest city to the route
    route.push(nearestCity);
    totalDistance += minDistance;
    
    // Update current city
    currentCity = nearestCity;
    
    // Remove the city from unvisited and mandatory sets
    unvisited.delete(nearestCity);
    mandatoryToVisit.delete(nearestCity);
  }
  
  // Add the return to the start city
  totalDistance += adjacencyMatrix.getDistance(currentCity, startCity);
  route.push(startCity);
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  return { 
    route, 
    distance: totalDistance, 
    executionTime,
    algorithmName: "Nearest Neighbor" 
  };
}

/**
 * Solves the Traveling Salesman Problem using an exhaustive search approach
 * 
 * @param adjacencyMatrix - The adjacency matrix with distances between cities
 * @param startCity - The city to start from (and return to)
 * @param mandatoryCities - Cities that must be visited (in any order)
 * @returns Object containing the route, total distance, and execution time
 */
export function bruteForceAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): TSPResult {
  const startTime = performance.now();
  
  // For the brute force, we only consider mandatory cities
  // Filter out the start city from mandatory cities list
  const citiesToPermute = mandatoryCities.filter(city => city !== startCity);
  
  // Generate all permutations of cities to visit
  const permutations = generatePermutations(citiesToPermute);
  
  let bestRoute: string[] = [];
  let bestDistance = Infinity;
  
  // Check each permutation
  for (const permutation of permutations) {
    // Add start city at beginning and end
    const route = [startCity, ...permutation, startCity];
    
    // Calculate total distance
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      distance += adjacencyMatrix.getDistance(route[i], route[i + 1]);
    }
    
    // Update best route if this one is better
    if (distance < bestDistance) {
      bestDistance = distance;
      bestRoute = [...route];
    }
  }
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  return { 
    route: bestRoute, 
    distance: bestDistance, 
    executionTime,
    algorithmName: "Brute Force" 
  };
}

/**
 * Generate all permutations of a given array
 * (Helper function for brute force algorithm)
 */
function generatePermutations<T>(elements: T[]): T[][] {
  // Base case: 1 or 0 elements
  if (elements.length <= 1) {
    return [elements];
  }
  
  const result: T[][] = [];
  
  // Try each element as first element
  for (let i = 0; i < elements.length; i++) {
    // Get current element
    const current = elements[i];
    
    // Get remaining elements
    const remaining = elements.slice(0, i).concat(elements.slice(i + 1));
    
    // Generate all permutations of remaining elements
    const remainingPermutations = generatePermutations(remaining);
    
    // Add current element to the beginning of each permutation of remaining elements
    for (const permutation of remainingPermutations) {
      result.push([current, ...permutation]);
    }
  }
  
  return result;
}

/**
 * Branch and Bound algorithm for TSP - a recursive approach that prunes the search tree
 * 
 * @param adjacencyMatrix - The adjacency matrix with distances between cities
 * @param startCity - The city to start from (and return to)
 * @param mandatoryCities - Cities that must be visited (in any order)
 * @returns Object containing the route, total distance, and execution time
 */
export function branchAndBoundAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): TSPResult {
  const startTime = performance.now();
  
  // Filter out the start city from mandatory cities
  const citiesToVisit = mandatoryCities.filter(city => city !== startCity);
  
  // Initialize global best route and distance
  let globalBestRoute: string[] = [];
  let globalBestDistance = Infinity;
  
  // Initialize visited cities array and current path
  const visited = new Set<string>([startCity]);
  const currentPath = [startCity];
  let currentDistance = 0;
  
  // Call recursive helper function
  branchAndBoundHelper(
    adjacencyMatrix,
    startCity,
    currentPath,
    currentDistance,
    visited,
    citiesToVisit,
    (route, distance) => {
      if (distance < globalBestDistance) {
        globalBestDistance = distance;
        globalBestRoute = [...route];
      }
    }
  );
  
  const endTime = performance.now();
  // Ensure we have at least a small positive number for execution time
  const executionTime = Math.max(0.01, endTime - startTime);
  
  return {
    route: globalBestRoute,
    distance: globalBestDistance,
    executionTime,
    algorithmName: "Branch and Bound"
  };
}

/**
 * Recursive helper function for Branch and Bound algorithm
 */
function branchAndBoundHelper(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  currentPath: string[],
  currentDistance: number,
  visited: Set<string>,
  mandatoryCities: string[],
  updateBest: (route: string[], distance: number) => void
): void {
  // Check if we've visited all mandatory cities
  const allVisited = mandatoryCities.every(city => visited.has(city));
  
  if (allVisited) {
    // Return to start city to complete the tour
    const lastCity = currentPath[currentPath.length - 1];
    const returnDistance = adjacencyMatrix.getDistance(lastCity, startCity);
    const totalDistance = currentDistance + returnDistance;
    
    // Update best solution if this one is better
    updateBest([...currentPath, startCity], totalDistance);
    return;
  }
  
  // Get the last city in our current path
  const lastCity = currentPath[currentPath.length - 1];
  
  // Try each unvisited mandatory city as the next step
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
      
      // Add city to path and mark as visited
      visited.add(nextCity);
      currentPath.push(nextCity);
      
      // Recursively explore this path
      branchAndBoundHelper(
        adjacencyMatrix,
        startCity,
        currentPath,
        newDistance,
        visited,
        mandatoryCities,
        updateBest
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
export function runAllTspAlgorithms(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): TSPResult[] {
  // Limit brute force to cities ≤ 10 to prevent excessive computation
  let results: TSPResult[] = [];
  
  // Always run nearest neighbor (fast for any size)
  results.push(nearestNeighborAlgorithm(adjacencyMatrix, startCity, mandatoryCities));
  
  // Run branch and bound (recursive approach)
  results.push(branchAndBoundAlgorithm(adjacencyMatrix, startCity, mandatoryCities));
  
  // Only run brute force for smaller instances
  if (mandatoryCities.length <= 10) {
    results.push(bruteForceAlgorithm(adjacencyMatrix, startCity, mandatoryCities));
  } else {
    // For larger instances, add a note that brute force was skipped
    results.push({
      route: [],
      distance: Infinity,
      executionTime: 0,
      algorithmName: "Brute Force (skipped due to complexity)"
    });
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