"use client"

import { useState } from "react"
import type { City } from "./types"

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

export function useGameLogic() {
  const [cities, setCities] = useState<City[]>(allCities)
  const [distanceMatrix, setDistanceMatrix] = useState<Record<string, Record<string, number>>>({})

  // Generate a map with random distances between cities
  const generateCityMap = () => {
    // Generate random distances between cities (50-100 km)
    const newDistanceMatrix: Record<string, Record<string, number>> = {}

    cities.forEach((city1) => {
      newDistanceMatrix[city1.id] = {}

      cities.forEach((city2) => {
        if (city1.id === city2.id) {
          newDistanceMatrix[city1.id][city2.id] = 0
        } else if (newDistanceMatrix[city2.id]?.[city1.id] !== undefined) {
          // Use the same distance for both directions
          newDistanceMatrix[city1.id][city2.id] = newDistanceMatrix[city2.id][city1.id]
        } else {
          // Generate a random distance between 50 and 100
          const distance = Math.floor(Math.random() * 51) + 50
          newDistanceMatrix[city1.id][city2.id] = distance
        }
      })
    })

    setDistanceMatrix(newDistanceMatrix)
  }

  return {
    cities,
    distanceMatrix,
    generateCityMap,
  }
}
