// filepath: c:\Users\ryans\Desktop\Bsc Computing\PDSA-2\CW\pdsa-games-hub\games\game2\logic\route-algorithms.ts
/**
 * Implementation of algorithms for solving the Traveling Salesman Problem
 */

import { AdjacencyMatrix } from "./adjacency-matrix";

/**
 * Solves the Traveling Salesman Problem using the Nearest Neighbor algorithm
 * 
 * @param adjacencyMatrix - The adjacency matrix with distances between cities
 * @param startCity - The city to start from (and return to)
 * @param mandatoryCities - Cities that must be visited (in any order)
 * @returns Object containing the route and total distance
 */
export function nearestNeighborAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): { route: string[]; distance: number } {
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
  
  return { route, distance: totalDistance };
}

/**
 * Solves the Traveling Salesman Problem using an exhaustive search approach
 * for small instances (limited to 10 cities due to factorial complexity)
 * 
 * @param adjacencyMatrix - The adjacency matrix with distances between cities
 * @param startCity - The city to start from (and return to)
 * @param mandatoryCities - Cities that must be visited (in any order)
 * @returns Object containing the route and total distance
 */
export function bruteForceAlgorithm(
  adjacencyMatrix: AdjacencyMatrix,
  startCity: string,
  mandatoryCities: string[]
): { route: string[]; distance: number } {
  // For the brute force, we only consider mandatory cities
  // Filter out the start city from mandatory cities list
  const citiesToPermute = mandatoryCities.filter(city => city !== startCity);
  
  // Limit brute force to 9 cities (factorial explosion after that)
  if (citiesToPermute.length > 9) {
    // Fallback to nearest neighbor for large instances
    return nearestNeighborAlgorithm(adjacencyMatrix, startCity, mandatoryCities);
  }
  
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
  
  return { route: bestRoute, distance: bestDistance };
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