"use client"

import { useState, useCallback } from "react"
import type { City, GameState } from "./types"
import { GamePhase } from "./types"
import { AdjacencyMatrix } from "./adjacency-matrix"
import { 
  runAllTspAlgorithms, 
  getOptimalSolution,
  TSPResult 
} from "./route-algorithms"

// Define all possible cities
const allCities: City[] = [
  { id: "A", name: "City A" },
  { id: "B", name: "City B" },
  { id: "C", name: "City C" },
  { id: "D", name: "City D" },
  { id: "E", name: "City E" },
  { id: "F", name: "City F" },
  { id: "G", name: "City G" },
  { id: "H", name: "City H" },
  { id: "I", name: "City I" },
  { id: "J", name: "City J" },
]

const initialGameState: GameState = {
  currentRoute: [],
  startCity: null,
  homeCity: null,  // Add the homeCity property to initial state
  totalDistance: 0,
  isComplete: false,
}

export function useGameLogic() {
  // Game phase tracking
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.SETUP)

  // City management
  const [availableCities, setAvailableCities] = useState<City[]>([])
  const [selectedCities, setSelectedCities] = useState<City[]>([])

  // Adjacency matrix
  const [adjacencyMatrix, setAdjacencyMatrix] = useState<AdjacencyMatrix | null>(null)

  // Game state
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  
  // Algorithm results
  const [algorithmResults, setAlgorithmResults] = useState<TSPResult[]>([])
  const [optimalRoute, setOptimalRoute] = useState<TSPResult | null>(null)

  // Map visualization state
  const [isMapReady, setIsMapReady] = useState(false)

  // Add a state variable for forcing a new game
  const [forceNewGame, setForceNewGame] = useState(false)

  // Reset the game state
  const resetGame = useCallback(() => {
    setGameState(initialGameState)
    setOptimalRoute(null)
    setAlgorithmResults([])
  }, [])

  // Initialize available cities based on count and create the map
  const initializeGame = useCallback(
    (cityCount: number) => {
      // Only initialize if we're in the setup phase or explicitly starting a new game
      if (gamePhase !== GamePhase.SETUP && !forceNewGame) return

      // Reset the force new game flag
      setForceNewGame(false)

      // Get the first N cities from the all cities list
      const cities = allCities.slice(0, cityCount).map((city) => ({
        ...city,
        selected: false,
      }))

      setAvailableCities(cities)
      setSelectedCities([])

      // Create a new adjacency matrix
      const cityIds = cities.map((city) => city.id)
      const matrix = new AdjacencyMatrix(cityIds)
      setAdjacencyMatrix(matrix)

      // Move to map visualization phase
      setGamePhase(GamePhase.MAP_VISUALIZATION)
      setIsMapReady(false)

      // Reset game state
      resetGame()
    },
    [gamePhase, forceNewGame, resetGame],
  )

  // Select a random home city after map visualization
  const selectRandomHomeCity = useCallback(() => {
    if (availableCities.length === 0) return null;
    
    // Select a random city from available cities
    const randomIndex = Math.floor(Math.random() * availableCities.length);
    const homeCity = availableCities[randomIndex].id;
    
    // Update game state with the selected home city
    setGameState(prevState => ({
      ...prevState,
      homeCity
    }));
    
    return homeCity;
  }, [availableCities]);

  // Called when the map visualization is complete
  const onMapVisualizationComplete = useCallback(() => {
    setIsMapReady(true);
    // Randomly select a home city when the map is ready
    selectRandomHomeCity();
  }, [selectRandomHomeCity]);

  // Move to city selection phase after map is visualized
  const startCitySelection = useCallback(() => {
    if (isMapReady) {
      setGamePhase(GamePhase.CITY_SELECTION)
    }
  }, [isMapReady])

  // Toggle city selection
  const toggleCitySelection = useCallback(
    (cityId: string) => {
      if (gamePhase !== GamePhase.CITY_SELECTION) return;
      
      // Check if the city is the home city, if so don't allow selection
      if (cityId === gameState.homeCity) return;

      setAvailableCities((prev) =>
        prev.map((city) => (city.id === cityId ? { ...city, selected: !city.selected } : city)),
      )
    },
    [gamePhase, gameState.homeCity],
  )

  // Confirm city selection
  const confirmCitySelection = useCallback(() => {
    const selected = availableCities.filter((city) => city.selected)

    // Ensure at least 3 cities are selected
    if (selected.length < 3) {
      return false
    }

    // Keep the same cities in availableCities, but mark the mandatory visit cities
    setSelectedCities(selected)

    // Move to route planning phase with all cities still available
    setGamePhase(GamePhase.ROUTE_PLANNING)

    return true
  }, [availableCities])

  // Select a city to add to the route (for future route planning phase)
  const selectCity = useCallback(
    (cityId: string) => {
      if (gamePhase !== GamePhase.ROUTE_PLANNING || !adjacencyMatrix || gameState.isComplete) return

      // If this is the first city, set it as the start city
      if (gameState.currentRoute.length === 0) {
        setGameState({
          ...gameState,
          currentRoute: [cityId],
          startCity: cityId,
          totalDistance: 0,
        })
        return
      }

      // If the city is already in the route, do nothing
      if (gameState.currentRoute.includes(cityId)) {
        // Unless it's the start city and we've visited all other cities
        if (cityId === gameState.startCity && gameState.currentRoute.length === selectedCities.length) {
          const lastCity = gameState.currentRoute[gameState.currentRoute.length - 1]
          const newDistance = gameState.totalDistance + adjacencyMatrix.getDistance(lastCity, cityId)

          setGameState({
            ...gameState,
            currentRoute: [...gameState.currentRoute, cityId],
            totalDistance: newDistance,
            isComplete: true,
          })

          // Move to completed phase
          setGamePhase(GamePhase.COMPLETED)
        }
        return
      }

      // Add the city to the route
      const lastCity = gameState.currentRoute[gameState.currentRoute.length - 1]
      const newRoute = [...gameState.currentRoute, cityId]
      const newDistance = gameState.totalDistance + adjacencyMatrix.getDistance(lastCity, cityId)

      setGameState({
        ...gameState,
        currentRoute: newRoute,
        totalDistance: newDistance,
        isComplete: false,
      })
    },
    [gamePhase, adjacencyMatrix, gameState, selectedCities],
  )

  // Calculate the optimal route using all algorithms
  const calculateOptimalRoute = useCallback(() => {
    if (!adjacencyMatrix || !gameState.homeCity) return null;

    // Get the mandatory cities (selected by user)
    const mandatoryCities = selectedCities.map(city => city.id);
    
    // Run all algorithms and get their results
    const results = runAllTspAlgorithms(adjacencyMatrix, gameState.homeCity, mandatoryCities);
    
    // Store all algorithm results
    setAlgorithmResults(results);
    
    // Get the optimal solution from all results
    const optimal = getOptimalSolution(results);
    
    // Store the optimal route
    setOptimalRoute(optimal);
    
    // Return the optimal solution
    return optimal;
  }, [adjacencyMatrix, gameState.homeCity, selectedCities]);

  // Force start a new game
  const forceStartNewGame = useCallback(() => {
    setForceNewGame(true)
  }, [])

  return {
    gamePhase,
    availableCities,
    selectedCities,
    adjacencyMatrix,
    gameState,
    optimalRoute,
    algorithmResults, // New: expose algorithm results
    isMapReady,
    initializeGame,
    onMapVisualizationComplete,
    startCitySelection,
    toggleCitySelection,
    confirmCitySelection,
    selectCity,
    resetGame,
    calculateOptimalRoute,
    forceStartNewGame,
    setGamePhase,
  }
}
