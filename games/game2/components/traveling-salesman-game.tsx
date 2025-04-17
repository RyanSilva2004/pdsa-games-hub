"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CityMap } from "./city-map"
import { useGameLogic } from "../logic/use-game-logic"
import { GamePhase } from "../logic/types"

export function TravelingSalesmanGame() {
  const [playerName, setPlayerName] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [showOptimalRoute, setShowOptimalRoute] = useState(false)
  const [cityCount, setCityCount] = useState<number>(6) // Default to 6 cities
  const [cityMapKey, setCityMapKey] = useState<number>(0) // Used to force remount only when needed

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
    setMessage({
      type: "info",
      text: "Starting a new game. Please select the number of cities.",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Helper function for rendering CityMap - used in multiple phases
  const renderCityMap = () => (
    <CityMap
      key={cityMapKey} // Only changes when starting a new game
      phase={gamePhase}
      cities={availableCities}
      adjacencyMatrix={adjacencyMatrix}
      onMapReady={gamePhase === GamePhase.MAP_VISUALIZATION ? handleMapReady : undefined}
      onCitySelect={gamePhase === GamePhase.CITY_SELECTION ? handleCitySelectionToggle : undefined}
      currentRoute={gameState.currentRoute}
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
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleConfirmSelection}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={availableCities.filter((city) => city.selected).length < 3}
                  >
                    Confirm Selection
                  </Button>
                  <Button onClick={handleNewGame} variant="outline" className="w-full">
                    New Game
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-base text-purple-600/70 dark:text-purple-400/70">
              Select the cities you want to include in your journey by clicking on them.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
