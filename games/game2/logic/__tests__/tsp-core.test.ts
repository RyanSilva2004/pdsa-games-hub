import { AdjacencyMatrix } from '../adjacency-matrix';
import { 
  nearestNeighborAlgorithm, 
  bruteForceAlgorithm, 
  branchAndBoundAlgorithm,
  runAllTspAlgorithms,
  getOptimalSolution
} from '../route-algorithms';
import { GamePhase } from '../types';

describe('Traveling Salesman Game Core Tests', () => {
  // Test 1: Adjacency Matrix - verify structure and distance calculations
  test('AdjacencyMatrix should correctly initialize and calculate distances', () => {
    const cityIds = ['A', 'B', 'C', 'D'];
    const matrix = new AdjacencyMatrix(cityIds);
    
    // Verify all cities were added
    expect(matrix.getCityIds()).toEqual(cityIds);
    
    // Verify matrix properties: symmetry and self-distance = 0
    cityIds.forEach(cityA => {
      cityIds.forEach(cityB => {
        // Distance to self is 0
        if (cityA === cityB) {
          expect(matrix.getDistance(cityA, cityB)).toBe(0);
        } else {
          // Distance A→B equals B→A (symmetry)
          expect(matrix.getDistance(cityA, cityB)).toBe(matrix.getDistance(cityB, cityA));
          // All distances should be greater than 0
          expect(matrix.getDistance(cityA, cityB)).toBeGreaterThan(0);
        }
      });
    });
    
    // Calculate a route distance
    const route = ['A', 'B', 'C', 'D', 'A'];
    const expectedDistance = 
      matrix.getDistance('A', 'B') +
      matrix.getDistance('B', 'C') +
      matrix.getDistance('C', 'D') +
      matrix.getDistance('D', 'A');
    
    expect(matrix.calculateRouteDistance(route)).toBe(expectedDistance);
  });

  // Test 2: TSP Algorithms - verify they find valid routes
  test('All TSP algorithms should find valid routes', async () => {
    // Create a controlled matrix with known distances
    const cities = ['A', 'B', 'C', 'D'];
    const matrix = new AdjacencyMatrix(cities, false); // No randomization
    
    matrix.setDistance('A', 'B', 10);
    matrix.setDistance('A', 'C', 15);
    matrix.setDistance('A', 'D', 20);
    matrix.setDistance('B', 'C', 35);
    matrix.setDistance('B', 'D', 25);
    matrix.setDistance('C', 'D', 30);
    
    const startCity = 'A';
    const mandatoryCities = ['B', 'C', 'D'];
    
    // Run all algorithms
    const results = await runAllTspAlgorithms(matrix, startCity, mandatoryCities);
    
    // Should have 3 algorithms
    expect(results.length).toBe(3);
    
    // Each algorithm should:
    results.forEach(result => {
      // 1. Create a route that starts and ends with the start city
      expect(result.route[0]).toBe(startCity);
      expect(result.route[result.route.length - 1]).toBe(startCity);
      
      // 2. Include all mandatory cities
      mandatoryCities.forEach(city => {
        expect(result.route).toContain(city);
      });
      
      // 3. Have a valid distance calculation
      expect(result.distance).toBe(matrix.calculateRouteDistance(result.route));
      
      // 4. Measure execution time
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  // Test 3: Optimal solution finder
  test('getOptimalSolution should find the minimum distance route', () => {
    const results = [
      {
        route: ['A', 'B', 'C', 'D', 'A'],
        distance: 100,
        executionTime: 1,
        algorithmName: 'Algorithm 1'
      },
      {
        route: ['A', 'D', 'C', 'B', 'A'],
        distance: 80,
        executionTime: 2,
        algorithmName: 'Algorithm 2'
      },
      {
        route: ['A', 'C', 'B', 'D', 'A'],
        distance: 90,
        executionTime: 3,
        algorithmName: 'Algorithm 3'
      }
    ];
    
    const optimal = getOptimalSolution(results);
    
    // Should select the result with minimum distance
    expect(optimal.distance).toBe(80);
    expect(optimal.route).toEqual(['A', 'D', 'C', 'B', 'A']);
    expect(optimal.algorithmName).toBe('Algorithm 2');
  });

  // Test 4: Game Phases structure
  test('GamePhase enum should have the expected structure', () => {
    // Verify the game has the required phases
    expect(GamePhase.SETUP).toBe('setup');
    expect(GamePhase.MAP_VISUALIZATION).toBe('map_visualization');
    expect(GamePhase.CITY_SELECTION).toBe('city_selection');
    expect(GamePhase.ROUTE_PLANNING).toBe('route_planning');
    expect(GamePhase.COMPLETED).toBe('completed');
  });

  // Test 5: Brute Force and Branch & Bound should find the same optimal solution
  test('Brute Force and Branch & Bound algorithms should both find the optimal solution', () => {
    // Create a test case with known distances
    const cities = ['A', 'B', 'C', 'D', 'E'];
    const matrix = new AdjacencyMatrix(cities, false); // No randomization
    
    // Set specific distances to create a non-trivial test case
    matrix.setDistance('A', 'B', 10);
    matrix.setDistance('A', 'C', 20);
    matrix.setDistance('A', 'D', 30);
    matrix.setDistance('A', 'E', 40);
    matrix.setDistance('B', 'C', 15);
    matrix.setDistance('B', 'D', 25);
    matrix.setDistance('B', 'E', 35);
    matrix.setDistance('C', 'D', 12);
    matrix.setDistance('C', 'E', 22);
    matrix.setDistance('D', 'E', 18);
    
    const startCity = 'A';
    const mandatoryCities = ['B', 'C', 'D', 'E'];
    
    // Get results from both exhaustive algorithms
    const bruteForceResult = bruteForceAlgorithm(matrix, startCity, mandatoryCities);
    const branchAndBoundResult = branchAndBoundAlgorithm(matrix, startCity, mandatoryCities);
    
    // Both should find the same optimal distance (but routes might be reversed)
    expect(bruteForceResult.distance).toBe(branchAndBoundResult.distance);
    
    // Verify that both are actually calculating the correct distance
    expect(bruteForceResult.distance).toBe(
      matrix.calculateRouteDistance(bruteForceResult.route)
    );
    expect(branchAndBoundResult.distance).toBe(
      matrix.calculateRouteDistance(branchAndBoundResult.route)
    );
  });

  // Test 6: Adjacency Matrix should handle random distances consistently
  test('AdjacencyMatrix with random distances should maintain properties', () => {
    // Test with multiple random matrices to ensure consistency
    for (let i = 0; i < 5; i++) {
      const cityIds = ['A', 'B', 'C', 'D', 'E'];
      const matrix = new AdjacencyMatrix(cityIds); // Default randomization
      
      // Verify distance ranges are within expected values
      cityIds.forEach(cityA => {
        cityIds.forEach(cityB => {
          if (cityA !== cityB) {
            const distance = matrix.getDistance(cityA, cityB);
            
            // Check if distances are in the expected range
            // (Assuming your random distances are between 50-99 as in your implementation)
            expect(distance).toBeGreaterThanOrEqual(50);
            expect(distance).toBeLessThanOrEqual(99);
            
            // Verify symmetry property is maintained
            expect(distance).toBe(matrix.getDistance(cityB, cityA));
          }
        });
      });
      
      // Test that route distance calculation works with random distances
      const route = ['A', 'C', 'E', 'B', 'D', 'A'];
      const expectedDistance = 
        matrix.getDistance('A', 'C') +
        matrix.getDistance('C', 'E') +
        matrix.getDistance('E', 'B') +
        matrix.getDistance('B', 'D') +
        matrix.getDistance('D', 'A');
      
      expect(matrix.calculateRouteDistance(route)).toBe(expectedDistance);
    }
  });
});