"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import type { City } from "../logic/types"

interface RouteVisualizerProps {
  cities: City[]
  homeCity: string
  distanceMatrix: Record<string, Record<string, number>>
  currentRoute: string[]
  onCitySelect: (cityId: string) => void
}

export function RouteVisualizer({
  cities,
  homeCity,
  distanceMatrix,
  currentRoute,
  onCitySelect,
}: RouteVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw the cities and routes on the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate city positions (in a circle)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 50

    const cityPositions: Record<string, { x: number; y: number }> = {}

    cities.forEach((city, index) => {
      const angle = (index / cities.length) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      cityPositions[city.id] = { x, y }
    })

    // Draw connections between cities with distances
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1

    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const city1 = cities[i]
        const city2 = cities[j]

        const pos1 = cityPositions[city1.id]
        const pos2 = cityPositions[city2.id]

        // Draw line
        ctx.beginPath()
        ctx.moveTo(pos1.x, pos1.y)
        ctx.lineTo(pos2.x, pos2.y)
        ctx.stroke()

        // Draw distance
        const distance = distanceMatrix[city1.id][city2.id]
        const midX = (pos1.x + pos2.x) / 2
        const midY = (pos1.y + pos2.y) / 2

        ctx.fillStyle = "#888"
        ctx.font = "12px sans-serif"
        ctx.fillText(`${distance}km`, midX, midY)
      }
    }

    // Draw the current route
    if (currentRoute.length > 1) {
      ctx.strokeStyle = "#3B82F6"
      ctx.lineWidth = 3

      for (let i = 0; i < currentRoute.length - 1; i++) {
        const cityId1 = currentRoute[i]
        const cityId2 = currentRoute[i + 1]

        if (cityPositions[cityId1] && cityPositions[cityId2]) {
          const pos1 = cityPositions[cityId1]
          const pos2 = cityPositions[cityId2]

          ctx.beginPath()
          ctx.moveTo(pos1.x, pos1.y)
          ctx.lineTo(pos2.x, pos2.y)
          ctx.stroke()
        }
      }
    }

    // Draw cities
    cities.forEach((city) => {
      const pos = cityPositions[city.id]

      // Draw city circle
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI)

      if (city.id === homeCity) {
        ctx.fillStyle = "#8B5CF6" // Purple for home city
      } else if (currentRoute.includes(city.id)) {
        ctx.fillStyle = "#3B82F6" // Blue for visited cities
      } else {
        ctx.fillStyle = "#1F2937" // Dark for unvisited cities
      }

      ctx.fill()

      // Draw city label
      ctx.fillStyle = "#fff"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(city.id, pos.x, pos.y)
    })
  }, [cities, homeCity, distanceMatrix, currentRoute])

  // Handle click on a city
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate city positions (same as in useEffect)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 50

    const cityPositions: Record<string, { x: number; y: number }> = {}

    cities.forEach((city, index) => {
      const angle = (index / cities.length) * 2 * Math.PI
      const cityX = centerX + radius * Math.cos(angle)
      const cityY = centerY + radius * Math.sin(angle)

      cityPositions[city.id] = { x: cityX, y: cityY }
    })

    // Check if click is on a city
    for (const cityId in cityPositions) {
      const pos = cityPositions[cityId]
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))

      if (distance <= 20) {
        onCitySelect(cityId)
        break
      }
    }
  }

  return (
    <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full cursor-pointer" onClick={handleCanvasClick} />
    </div>
  )
}
