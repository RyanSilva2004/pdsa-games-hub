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

export function TravelingSalesmanGame() {
  const [playerName, setPlayerName] = useState("")
  const [gameState, setGameState] = useState<"name-entry" | "city-map">("name-entry")
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const { cities, distanceMatrix, generateCityMap } = useGameLogic()

  // Start the game after name entry
  const startGame = () => {
    if (playerName.trim() === "") {
      setMessage({ type: "error", text: "Please enter your name to start the game" })
      return
    }

    // Generate random city distances
    generateCityMap()
    setGameState("city-map")
    setMessage({
      type: "info",
      text: "Building map based on city distances. Watch as cities are placed one by one!",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

  // Reload the map with new distances
  const reloadMap = () => {
    generateCityMap()
    setMessage({
      type: "info",
      text: "Generating new map with different distances between cities.",
    })

    // Clear the message after 5 seconds
    setTimeout(() => {
      setMessage(null)
    }, 5000)
  }

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

        {gameState === "name-entry" && (
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

            <Button
              onClick={startGame}
              disabled={playerName.trim() === ""}
              className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
            >
              Start Game
            </Button>
          </div>
        )}

        {gameState === "city-map" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg text-gray-700 dark:text-gray-200">Player:</span>
              <Badge
                variant="outline"
                className="text-lg px-3 py-1 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30"
              >
                {playerName}
              </Badge>
            </div>

            {/* Increased height for the map visualization */}
            <div className="w-full aspect-[16/10]">
              <CityMap cities={cities} distanceMatrix={distanceMatrix} onReload={reloadMap} />
            </div>

            <div className="text-center text-base text-purple-600/70 dark:text-purple-400/70 mt-4">
              This map shows cities positioned based on their actual distances from each other. Click the reload button
              to generate a new map with different distances.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
