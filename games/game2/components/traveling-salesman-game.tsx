"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CityMap } from "./city-map"
import { useGameLogic } from "../logic/use-game-logic"
import { GamePhase } from "../logic/types"
import type { City } from "../logic/types"

// Route Builder Component for users to enter their solution
interface RouteBuilderProps {
  homeCity: string | null
  availableCities: City[]
  selectedCities: City[]
  onSubmit: (route: string[]) => void
}

function RouteBuilder({ homeCity, availableCities, selectedCities, onSubmit }: RouteBuilderProps) {
  const [userRoute, setUserRoute] = useState<string[]>([])
  const [remainingCities, setRemainingCities] = useState<City[]>([])
  const [nextCity, setNextCity] = useState<string>("")
  const [totalDistance, setTotalDistance] = useState<number>(0)
  
  // Set up initial state
  useEffect(() => {
    if (homeCity) {
      // Start with home city
      setUserRoute([homeCity])
      // Initialize remaining cities (only those that must be visited)
      setRemainingCities(selectedCities.filter(city => city.id !== homeCity))
    }
  }, [homeCity, selectedCities])

  // Add a city to the route
  const addCityToRoute = () => {
    if (!nextCity) return

    // Add to route
    const newRoute = [...userRoute, nextCity]
    setUserRoute(newRoute)
    
    // Remove from remaining cities
    setRemainingCities(prevCities => prevCities.filter(city => city.id !== nextCity))
    
    // Reset selection
    setNextCity("")
  }

  // Remove last city from route
  const removeLastCity = () => {
    if (userRoute.length <= 1) return // Don't remove home city
    
    const lastCity = userRoute[userRoute.length - 1]
    const newRoute = userRoute.slice(0, -1)
    setUserRoute(newRoute)
    
    // Add back to remaining cities if it was a mandatory city
    const cityToAdd = selectedCities.find(city => city.id === lastCity)
    if (cityToAdd && cityToAdd.id !== homeCity) {
      setRemainingCities(prev => [...prev, cityToAdd])
    }
  }

  // Complete the route by returning to home city
  const completeRoute = () => {
    if (userRoute.length <= 1 || !homeCity) return
    if (userRoute[userRoute.length - 1] === homeCity) return // Already completed

    // Complete the route by adding home city again
    setUserRoute(prev => [...prev, homeCity])
  }

  // Determine if submit should be enabled
  const isSubmitEnabled = () => {
    // Route needs to start and end with home city
    return (
      userRoute.length > 0 &&
      userRoute[0] === homeCity &&
      userRoute[userRoute.length - 1] === homeCity &&
      remainingCities.length === 0 // All required cities must be included
    )
  }

  // Check if Return Home button should be active
  const canReturnHome = () => {
    return (
      userRoute.length > 1 && 
      remainingCities.length === 0 && // All required cities visited
      userRoute[userRoute.length - 1] !== homeCity // Not already returned home
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-md">
        <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Current Route</h4>
        <div className="flex flex-wrap gap-1 mb-3">
          {userRoute.map((cityId, index) => (
            <div key={`${cityId}-${index}`} className="flex items-center">
              <Badge className={cityId === homeCity ? "bg-yellow-500" : "bg-blue-600"}>
                {cityId}
              </Badge>
              {index < userRoute.length - 1 && (
                <span className="mx-1 text-gray-400">→</span>
              )}
            </div>
          ))}
          {userRoute.length === 0 && (
            <span className="text-gray-500 dark:text-gray-400">No cities added yet</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Select
            value={nextCity}
            onValueChange={setNextCity}
            disabled={remainingCities.length === 0}
          >
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="Select next city" />
            </SelectTrigger>
            <SelectContent>
              {remainingCities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  City {city.id}
                </SelectItem>
              ))}
              {/* Include non-selected cities (for shortcuts) */}
              {availableCities
                .filter(city => 
                  !userRoute.includes(city.id) && 
                  !remainingCities.some(c => c.id === city.id) &&
                  city.id !== homeCity
                )
                .map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    City {city.id} (optional)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={addCityToRoute} 
            disabled={!nextCity}
            variant="outline"
            className="shrink-0"
          >
            Add
          </Button>
        </div>

        <div className="flex justify-between gap-2">
          <Button 
            onClick={removeLastCity} 
            variant="outline" 
            disabled={userRoute.length <= 1}
            className="flex-1"
          >
            Remove Last
          </Button>
          <Button 
            onClick={completeRoute} 
            variant={canReturnHome() ? "default" : "outline"}
            disabled={!canReturnHome()}
            className={`flex-1 ${canReturnHome() ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
          >
            Return Home
          </Button>
        </div>

        <Button 
          onClick={() => onSubmit(userRoute)} 
          className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
          disabled={!isSubmitEnabled()}
        >
          Submit Solution
        </Button>
      </div>
    </div>
  )
}

export function TravelingSalesmanGame() {
  const [playerName, setPlayerName] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [showOptimalRoute, setShowOptimalRoute] = useState(false)
  const [cityCount, setCityCount] = useState<number>(6) // Default to 6 cities
  const [cityMapKey, setCityMapKey] = useState<number>(0) // Used to force remount only when needed
  const [userSolution, setUserSolution] = useState<string[]>([])
  const [solutionDistance, setSolutionDistance] = useState<number>(0)

  const {
    gamePhase,
    availableCities,
    selectedCities,
    adjacencyMatrix,
    gameState,
    optimalRoute,
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
  } = useGameLogic()

  // Start the game after name entry
  const startGame = () => {
    if (playerName.trim() === "") {
      setMessage({ type: "error", text: "Please enter your name to start the game" })
      return
    }

    // Initialize the game with the selected number of cities
    initializeGame(cityCount)

    setMessage({
      type: "info",
      text: "Building map based on city distances...",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Handle map visualization complete
  const handleMapReady = () => {
    onMapVisualizationComplete()
    setMessage({
      type: "info",
      text: "Map visualization complete. Click Continue to select cities.",
    })
  }

  // Start city selection phase
  const handleStartCitySelection = () => {
    startCitySelection()
    setMessage({
      type: "info",
      text: "Select the cities you want to visit by clicking on them, then click Confirm Selection.",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Handle city selection in the selection phase
  const handleCitySelectionToggle = (cityId: string) => {
    toggleCitySelection(cityId)
  }

  // Handle confirm city selection
  const handleConfirmSelection = () => {
    const success = confirmCitySelection()

    if (!success) {
      setMessage({
        type: "error",
        text: "Please select at least 3 cities for your journey.",
      })
      return
    }

    setMessage({
      type: "success",
      text: "Cities selected successfully! Your selection has been saved.",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Reset the game
  const handleReset = () => {
    resetGame()
    setShowOptimalRoute(false)
    setMessage({
      type: "info",
      text: "Game reset. Start building your route again!",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Start a new game
  const handleNewGame = () => {
    forceStartNewGame()
    setCityMapKey(prev => prev + 1) // Force CityMap to remount on new game
    setShowOptimalRoute(false)
    setUserSolution([])
    setSolutionDistance(0)

    // The key change: preserve player name but reset game state
    setGamePhase(GamePhase.SETUP)
    
    setMessage({
      type: "info",
      text: "Starting a new game. Please select the number of cities.",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Handle user route submission
  const handleRouteSubmit = (route: string[]) => {
    if (!adjacencyMatrix) return;

    // Calculate the distance of user's route
    const distance = adjacencyMatrix.calculateRouteDistance(route);
    
    setUserSolution(route);
    setSolutionDistance(distance);
    
    // Calculate the optimal route for comparison
    const optimal = calculateOptimalRoute();
    
    if (optimal) {
      // Determine if user found the optimal solution
      const isOptimal = distance === optimal.distance;
      
      // Calculate how close they were as a percentage
      const percentageFromOptimal = ((distance - optimal.distance) / optimal.distance * 100).toFixed(1);
      
      // Set appropriate message based on result
      if (isOptimal) {
        setMessage({
          type: "success",
          text: `Congratulations! You found the optimal route with a total distance of ${distance} km!`,
        });
      } else {
        setMessage({
          type: "info",
          text: `Your route has a total distance of ${distance} km. The optimal route is ${optimal.distance} km (${percentageFromOptimal}% difference).`,
        });
        
        // Show the optimal route immediately if the user's solution is wrong
        setShowOptimalRoute(true);
      }
    } else {
      setMessage({
        type: "info",
        text: `Your route has a total distance of ${distance} km.`,
      });
    }
    
    // Move to completed phase using the correct function from useGameLogic
    if (gamePhase === GamePhase.ROUTE_PLANNING) {
      setGamePhase(GamePhase.COMPLETED);
    }
  };

  // Helper function for rendering CityMap - used in multiple phases
  const renderCityMap = () => (
    <CityMap
      key={cityMapKey} // Only changes when starting a new game
      phase={gamePhase}
      cities={availableCities}
      adjacencyMatrix={adjacencyMatrix}
      onMapReady={gamePhase === GamePhase.MAP_VISUALIZATION ? handleMapReady : undefined}
      onCitySelect={gamePhase === GamePhase.CITY_SELECTION ? handleCitySelectionToggle : undefined}
      currentRoute={userSolution.length > 0 ? userSolution : gameState.currentRoute}
      highlightRoute={showOptimalRoute ? optimalRoute?.route : undefined}
      homeCity={gameState.homeCity}
    />
  )

  return (
    <Card className="w-full max-w-6xl border-purple-200 dark:border-purple-900">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/50">
        <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">Traveling Salesman Problem</CardTitle>
        <CardDescription className="text-lg text-purple-600/80 dark:text-purple-400/80">
          Find the shortest route that visits each city exactly once and returns to the starting point
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 bg-white dark:bg-gray-900">
        {message && (
          <Alert
            className={`mb-4 ${
              message.type === "success"
                ? "bg-green-500/20 border-green-500/30 dark:bg-green-900/30 dark:border-green-800/30"
                : message.type === "error"
                  ? "bg-red-500/20 border-red-500/30 dark:bg-red-900/30 dark:border-red-800/30"
                  : "bg-blue-500/20 border-blue-500/30 dark:bg-blue-900/30 dark:border-blue-800/30"
            }`}
          >
            <AlertTitle
              className={`${
                message.type === "success"
                  ? "text-green-700 dark:text-green-300"
                  : message.type === "error"
                    ? "text-red-700 dark:text-red-300"
                    : "text-blue-700 dark:text-blue-300"
              }`}
            >
              {message.type === "success" ? "Success!" : message.type === "error" ? "Error!" : "Info"}
            </AlertTitle>
            <AlertDescription className="text-gray-600 dark:text-gray-300">{message.text}</AlertDescription>
          </Alert>
        )}

        {gamePhase === GamePhase.SETUP && (
          <div className="space-y-6 max-w-md mx-auto py-8">
            <div>
              <Label htmlFor="playerName" className="text-lg text-gray-700 dark:text-gray-200">
                Your Name
              </Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="mt-2 text-lg h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            <div>
              <Label htmlFor="cityCount" className="text-lg text-gray-700 dark:text-gray-200">
                Number of Cities
              </Label>
              <div className="flex gap-2 mt-2">
                {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <Button
                    key={num}
                    variant={cityCount === num ? "default" : "outline"}
                    className={cityCount === num ? "bg-purple-600" : ""}
                    onClick={() => setCityCount(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Select the number of cities available on the map (A-{String.fromCharCode(64 + cityCount)}).
              </p>
            </div>

            <Button
              onClick={startGame}
              disabled={playerName.trim() === ""}
              className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
            >
              Start Game
            </Button>
          </div>
        )}

        {gamePhase === GamePhase.MAP_VISUALIZATION && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Player:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30"
                >
                  {playerName}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Phase:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30"
                >
                  Map Visualization
                </Badge>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-3/4 h-[500px]">
                {renderCityMap()}
              </div>

              <div className="w-full md:w-1/4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Map Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cities:</span>
                      <span className="font-medium">{availableCities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="font-medium">{isMapReady ? "Ready" : "Building..."}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    The map shows cities and distances between them. After visualization is complete, you'll be able to
                    select which cities to visit.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleStartCitySelection}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!isMapReady}
                  >
                    Continue to City Selection
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-base text-purple-600/70 dark:text-purple-400/70">
              {isMapReady
                ? "Map visualization complete. Click Continue to select cities."
                : "Building map based on city distances..."}
            </div>
          </div>
        )}

        {gamePhase === GamePhase.CITY_SELECTION && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Player:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30"
                >
                  {playerName}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Phase:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30"
                >
                  City Selection
                </Badge>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-3/4 h-[500px]">
                {renderCityMap()}
              </div>

              <div className="w-full md:w-1/4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Selected Cities</h3>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {availableCities.filter((city) => city.selected).length > 0 ? (
                      availableCities
                        .filter((city) => city.selected)
                        .map((city) => (
                          <Badge key={city.id} className="bg-blue-600">
                            {city.id}
                          </Badge>
                        ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">No cities selected yet</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click on cities to select/deselect them. You need at least 3 cities.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    The home city ({gameState.homeCity}) is fixed and can't be selected.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleConfirmSelection}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={availableCities.filter((city) => city.selected).length < 3}
                  >
                    Confirm Selection
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-base text-purple-600/70 dark:text-purple-400/70">
              Select the cities you want to visit during your journey. The shortest path will be calculated using all available cities.
            </div>
          </div>
        )}

        {gamePhase === GamePhase.ROUTE_PLANNING && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Player:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30"
                >
                  {playerName}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Phase:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30"
                >
                  Route Planning
                </Badge>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-3/4 h-[500px]">
                {renderCityMap()}
              </div>

              <div className="w-full md:w-1/4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Plan Your Route</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Home City:</span>
                      <Badge className="bg-yellow-500 self-start">{gameState.homeCity}</Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Selected Cities:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCities.map((city) => (
                          <Badge key={city.id} className="bg-blue-600">
                            {city.id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Find the shortest route that starts at the home city, visits all selected cities exactly once, and returns to the home city.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Your Solution</h3>
                  <div className="space-y-4">
                    <RouteBuilder 
                      homeCity={gameState.homeCity} 
                      availableCities={availableCities} 
                      selectedCities={selectedCities}
                      onSubmit={handleRouteSubmit}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-base text-purple-600/70 dark:text-purple-400/70">
              Create your route by selecting cities in order. Remember you must start and end at the home city.
            </div>
          </div>
        )}

        {gamePhase === GamePhase.COMPLETED && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Player:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30"
                >
                  {playerName}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg text-gray-700 dark:text-gray-200">Phase:</span>
                <Badge
                  variant="outline"
                  className="text-lg px-3 py-1 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30"
                >
                  Completed
                </Badge>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-3/4 h-[500px]">
                {renderCityMap()}
              </div>

              <div className="w-full md:w-1/4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Your Route</h3>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-md mb-3">
                    <div className="flex flex-wrap gap-1">
                      {userSolution.map((cityId, index) => (
                        <div key={`${cityId}-${index}`} className="flex items-center">
                          <Badge className={cityId === gameState.homeCity ? "bg-yellow-500" : "bg-blue-600"}>
                            {cityId}
                          </Badge>
                          {index < userSolution.length - 1 && (
                            <span className="mx-1 text-gray-400">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 font-medium text-purple-700 dark:text-purple-300">
                      Total Distance: {solutionDistance} KM
                    </div>
                  </div>
                  {optimalRoute && (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Optimal Route</h3>
                      <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-md">
                        <div className="flex flex-wrap gap-1">
                          {optimalRoute.route.map((cityId, index) => (
                            <div key={`opt-${cityId}-${index}`} className="flex items-center">
                              <Badge className={cityId === gameState.homeCity ? "bg-yellow-500" : "bg-green-600"}>
                                {cityId}
                              </Badge>
                              {index < optimalRoute.route.length - 1 && (
                                <span className="mx-1 text-gray-400">→</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 font-medium text-green-700 dark:text-green-300">
                          Total Distance: {optimalRoute.distance} KM
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  <Button
                    onClick={handleNewGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Start New Game
                  </Button>
                  <Button
                    onClick={() => setShowOptimalRoute(!showOptimalRoute)}
                    variant="outline"
                    className="w-full"
                  >
                    {showOptimalRoute ? "Hide Optimal Route" : "Show Optimal Route"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-base text-purple-600/70 dark:text-purple-400/70">
              {solutionDistance === (optimalRoute?.distance || 0)
                ? "Congratulations! You found the optimal route!"
                : "You've completed the challenge. See how your route compares to the optimal solution."}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
