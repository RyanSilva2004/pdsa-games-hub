"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { City } from "../logic/types"
import { GamePhase } from "../logic/types"
import type { AdjacencyMatrix } from "../logic/adjacency-matrix"
import { mdsClassic } from "../util/mds"

// Store positions across all instances of the component to maintain consistency
// This prevents re-visualization when switching between phases
const globalCityPositions: Record<string, { x: number; y: number }> = {};

interface CityMapProps {
  phase: GamePhase
  cities: City[]
  adjacencyMatrix?: AdjacencyMatrix | null
  currentRoute?: string[]
  onCitySelect?: (cityId: string) => void
  onMapReady?: () => void
  highlightRoute?: string[]
  homeCity?: string | null
}

// Define a neon color palette for edges
const neonColors = [
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FF9500", // Orange
  "#39FF14", // Green
  "#FF3131", // Red
  "#FFF01F", // Yellow
  "#F56FFF", // Pink
  "#01C5BB", // Teal
  "#4D4DFF", // Blue
  "#FF6EC7", // Rose
]

export function CityMap({
  phase,
  cities,
  adjacencyMatrix,
  currentRoute = [],
  onCitySelect,
  onMapReady,
  highlightRoute,
  homeCity,
}: CityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [cityPositions, setCityPositions] = useState<Record<string, { x: number; y: number }>>({})
  // Flag to track if positions have been generated at least once
  const [positionsGenerated, setPositionsGenerated] = useState(false)
  // Create a unique key for this game instance
  const gameInstanceRef = useRef<string>(Math.random().toString(36).substring(2, 15))

  // Calculate city positions based on distances
  useEffect(() => {
    if (!cities.length) return // No cities to render

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Check if we already have positions in the global store
    const cityIds = cities.map(city => city.id).sort().join(',')
    const hasGlobalPositions = Object.keys(globalCityPositions).length > 0 && 
                               cities.every(city => city.id in globalCityPositions)

    // If positions exist globally or locally, use them
    if (hasGlobalPositions || positionsGenerated) {
      // Use existing positions, either from global store or component state
      const positions = hasGlobalPositions ? globalCityPositions : cityPositions
      
      // Update local state if we're using global positions
      if (hasGlobalPositions && Object.keys(cityPositions).length === 0) {
        setCityPositions({...globalCityPositions})
      }
        
      // Just redraw with current positions
      redrawMap(
        ctx,
        canvas.width,
        canvas.height,
        cities,
        positions,
        adjacencyMatrix,
        theme === "dark",
        phase,
        currentRoute,
        highlightRoute,
        homeCity
      )
      
      // If we've just loaded saved positions and we're in the map visualization phase, 
      // notify that we're ready
      if (phase === GamePhase.MAP_VISUALIZATION && !positionsGenerated && onMapReady) {
        setPositionsGenerated(true)
        setTimeout(() => {
          onMapReady()
        }, 500) // Small delay to ensure UI updates
      }
      
      return
    }

    // Only calculate new positions if we haven't done so before
    // and we're in the MAP_VISUALIZATION phase
    if (!positionsGenerated && phase === GamePhase.MAP_VISUALIZATION) {
      setIsAnimating(true)

      // Draw map background
      const isDarkMode = theme === "dark"
      drawMapBackground(ctx, canvas.width, canvas.height, isDarkMode)

      // Calculate positions (MDS or force-directed)
      if (adjacencyMatrix && cities.length > 1) {
        // Use MDS for true distance-based layout
        const cityIds = cities.map(c => c.id)
        const distMatrix = cityIds.map(id1 => cityIds.map(id2 => adjacencyMatrix.getDistance(id1, id2)))
        
        try {
          // Run MDS
          const mdsCoords = mdsClassic(distMatrix, 2)
          
          // Find bounds
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
          mdsCoords.forEach(({x, y}) => {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          })
          
          // Scale and center to fit canvas
          const padding = 60
          const plotW = canvas.width - 2 * padding
          const plotH = canvas.height - 2 * padding
          const scaleX = plotW / (maxX - minX || 1)
          const scaleY = plotH / (maxY - minY || 1)
          const scale = Math.min(scaleX, scaleY)
          
          // Create positions object
          const newPositions: Record<string, { x: number; y: number }> = {}
          mdsCoords.forEach((coord, i) => {
            newPositions[cityIds[i]] = {
              x: padding + (coord.x - minX) * scale,
              y: padding + (coord.y - minY) * scale,
            }
          })
          
          // Ensure cities aren't too close to each other
          ensureCitySeparation(newPositions, 80) // Minimum 80px between cities
          
          // Update local positions state
          setCityPositions(newPositions)
          
          // Save to global positions store
          Object.assign(globalCityPositions, newPositions)
          
          // Mark positions as generated so we don't recalculate
          setPositionsGenerated(true)
          
          // Animate drawing
          animateDrawing(ctx, canvas.width, canvas.height, cities, newPositions, 
                        adjacencyMatrix, isDarkMode, phase, () => {
            setIsAnimating(false)
            if (onMapReady) {
              onMapReady()
            }
          })
        } catch (e) {
          console.error("MDS calculation failed:", e)
          fallbackPositioning()
        }
      } else {
        // Fallback to simple circular layout
        fallbackPositioning()
      }
    }
    
    // Fallback positioning function (circular layout)
    function fallbackPositioning() {
      // Calculate positions in a circle
      const newPositions: Record<string, { x: number; y: number }> = {}
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.4 - 30
      
      cities.forEach((city, i) => {
        const angle = (i / cities.length) * 2 * Math.PI
        newPositions[city.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        }
      })
      
      // Update local positions state
      setCityPositions(newPositions)
      
      // Save to global positions store
      Object.assign(globalCityPositions, newPositions)
      
      // Mark positions as generated
      setPositionsGenerated(true)
      
      // Draw the map with the new positions
      redrawMap(
        ctx,
        canvas.width,
        canvas.height,
        cities,
        newPositions,
        adjacencyMatrix,
        theme === "dark",
        phase,
        currentRoute,
        highlightRoute,
        homeCity
      )
      
      setIsAnimating(false)
      if (onMapReady) {
        onMapReady()
      }
    }
  }, [cities, adjacencyMatrix, theme, phase, onMapReady, currentRoute, highlightRoute, homeCity, positionsGenerated])

  // Ensure cities maintain minimum separation
  function ensureCitySeparation(
    positions: Record<string, { x: number; y: number }>, 
    minDistance: number
  ) {
    const cityIds = Object.keys(positions)
    let adjustmentMade = true
    const iterations = 20 // Limit iterations to avoid infinite loop
    
    for (let iter = 0; iter < iterations && adjustmentMade; iter++) {
      adjustmentMade = false
      
      for (let i = 0; i < cityIds.length; i++) {
        for (let j = i + 1; j < cityIds.length; j++) {
          const id1 = cityIds[i]
          const id2 = cityIds[j]
          const pos1 = positions[id1]
          const pos2 = positions[id2]
          
          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < minDistance) {
            adjustmentMade = true
            
            // Calculate unit vector
            const ux = dx / distance
            const uy = dy / distance
            
            // Calculate push distance (half for each city)
            const pushDistance = (minDistance - distance) / 2
            
            // Push cities apart
            pos1.x -= ux * pushDistance
            pos1.y -= uy * pushDistance
            pos2.x += ux * pushDistance
            pos2.y += uy * pushDistance
          }
        }
      }
    }
  }

  // Draw the current route when it changes
  useEffect(() => {
    // Don't redraw if we're still animating or no positions available
    if (Object.keys(cityPositions).length === 0 || isAnimating) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Redraw the map with the current route
    redrawMap(
      ctx,
      canvas.width,
      canvas.height,
      cities,
      cityPositions,
      adjacencyMatrix,
      theme === "dark",
      phase,
      currentRoute,
      highlightRoute,
      homeCity,
    )
  }, [cities, cityPositions, adjacencyMatrix, theme, currentRoute, isAnimating, highlightRoute, phase, homeCity])

  // Animate drawing the map
  function animateDrawing(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cities: City[],
    positions: Record<string, { x: number; y: number }>,
    adjacencyMatrix: AdjacencyMatrix | null | undefined,
    isDarkMode: boolean,
    phase: GamePhase,
    onComplete: () => void
  ) {
    const drawnEdges = new Set<string>()
    const cityIds = cities.map(city => city.id)
    let edgeIndex = 0
    let cityIndex = 0
    let animationFrame: number
    
    function drawNextElement() {
      if (!adjacencyMatrix) {
        drawAllCities()
        onComplete()
        return
      }
      
      // First draw all edges
      if (edgeIndex < cityIds.length * (cityIds.length - 1) / 2) {
        let i = 0, j = 1
        let count = 0
        
        // Find the i,j indices for the current edge index
        while (count < edgeIndex) {
          j++
          if (j >= cityIds.length) {
            i++
            j = i + 1
          }
          count++
        }
        
        if (i < cityIds.length && j < cityIds.length) {
          const city1Id = cityIds[i]
          const city2Id = cityIds[j]
          
          // Draw the connection
          drawConnection(
            ctx,
            positions[city1Id],
            positions[city2Id],
            adjacencyMatrix.getDistance(city1Id, city2Id),
            edgeIndex,
            isDarkMode,
            drawnEdges,
            city1Id,
            city2Id
          )
        }
        
        edgeIndex++
        animationFrame = requestAnimationFrame(drawNextElement)
      }
      // Then draw all cities
      else if (cityIndex < cityIds.length) {
        const city = cities.find(c => c.id === cityIds[cityIndex])
        if (city) {
          const isHomeCity = city.id === homeCity
          drawCityNode(ctx, city, positions[city.id], isDarkMode, phase, false, false, isHomeCity)
        }
        
        cityIndex++
        animationFrame = requestAnimationFrame(drawNextElement)
      }
      // Animation complete
      else {
        onComplete()
      }
    }
    
    function drawAllCities() {
      cities.forEach(city => {
        const isHomeCity = city.id === homeCity
        drawCityNode(ctx, city, positions[city.id], isDarkMode, phase, false, false, isHomeCity)
      })
    }
    
    // Clear and draw background
    ctx.clearRect(0, 0, width, height)
    drawMapBackground(ctx, width, height, isDarkMode)
    
    // Start animation
    drawNextElement()
    
    // Cleanup function to cancel animation if component unmounts
    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }

  // Handle click on a city
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCitySelect || Object.keys(cityPositions).length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is on a city
    for (const city of cities) {
      const pos = cityPositions[city.id]
      if (!pos) continue

      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
      if (distance <= 40) {  // Increased click radius to match node size (35) plus some margin
        onCitySelect(city.id)
        
        // Redraw the map to show selection feedback immediately
        const ctx = canvas.getContext("2d")
        if (ctx) {
          redrawMap(
            ctx,
            canvas.width,
            canvas.height,
            cities,
            cityPositions,
            adjacencyMatrix,
            theme === "dark",
            phase,
            currentRoute,
            highlightRoute,
            homeCity,
          )
        }
        break
      }
    }
  }

  return (
    <div className="relative w-full h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={handleCanvasClick}
        style={{ cursor: onCitySelect ? "pointer" : "default" }}
      />
      {isAnimating && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-md shadow-md">
          <p className="text-sm text-purple-600 dark:text-purple-400">Building map...</p>
        </div>
      )}
      {phase === GamePhase.MAP_VISUALIZATION && !isAnimating && (
        <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-800/80 px-3 py-2 rounded-md shadow-md">
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Map visualization complete. Click Continue to select cities.
          </p>
        </div>
      )}
      {phase === GamePhase.CITY_SELECTION && (
        <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-800/80 px-3 py-2 rounded-md shadow-md">
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Click on cities to select them for your journey
          </p>
        </div>
      )}
    </div>
  )
}

// Redraw the entire map with the current route
function redrawMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cities: City[],
  cityPositions: Record<string, { x: number; y: number }>,
  adjacencyMatrix: AdjacencyMatrix | null | undefined,
  isDarkMode: boolean,
  phase: GamePhase,
  currentRoute: string[] = [],
  highlightRoute?: string[],
  homeCity?: string | null,
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw map background
  drawMapBackground(ctx, width, height, isDarkMode)

  // Draw all connections first if we have an adjacency matrix
  if (adjacencyMatrix) {
    const drawnEdges = new Set<string>()

    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const city1 = cities[i]
        const city2 = cities[j]

        const distance = adjacencyMatrix.getDistance(city1.id, city2.id)

        drawConnection(
          ctx,
          cityPositions[city1.id],
          cityPositions[city2.id],
          distance,
          i * cities.length + j,
          isDarkMode,
          drawnEdges,
          city1.id,
          city2.id,
        )
      }
    }

    // Draw the current route with a thicker line
    if (currentRoute.length > 1) {
      for (let i = 0; i < currentRoute.length - 1; i++) {
        const city1Id = currentRoute[i]
        const city2Id = currentRoute[i + 1]

        if (cityPositions[city1Id] && cityPositions[city2Id]) {
          drawRouteLine(ctx, cityPositions[city1Id], cityPositions[city2Id], isDarkMode, false)
        }
      }
    }

    // Draw the highlight route if provided (e.g., optimal route)
    if (highlightRoute && highlightRoute.length > 1) {
      for (let i = 0; i < highlightRoute.length - 1; i++) {
        const city1Id = highlightRoute[i]
        const city2Id = highlightRoute[i + 1]

        if (cityPositions[city1Id] && cityPositions[city2Id]) {
          drawRouteLine(ctx, cityPositions[city1Id], cityPositions[city2Id], isDarkMode, true)
        }
      }
    }
  }

  // Draw all city nodes on top
  cities.forEach((city) => {
    const isInRoute = currentRoute.includes(city.id)
    const isStartCity = currentRoute.length > 0 && currentRoute[0] === city.id
    const isHomeCity = city.id === homeCity

    drawCityNode(ctx, city, cityPositions[city.id], isDarkMode, phase, isInRoute, isStartCity, isHomeCity)
  })
}

// Draw a connection between cities with curved paths and flag labels
function drawConnection(
  ctx: CanvasRenderingContext2D,
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  distance: number,
  index: number,
  isDarkMode: boolean,
  drawnEdges: Set<string>,
  city1Id: string,
  city2Id: string,
) {
  // Create a unique key for the edge
  const edgeKey = `${Math.min(pos1.x, pos2.x)}-${Math.max(pos1.x, pos2.x)}-${Math.min(pos1.y, pos2.y)}-${Math.max(pos1.y, pos2.y)}`

  // Skip if this edge has already been drawn
  if (drawnEdges.has(edgeKey)) {
    return
  }
  drawnEdges.add(edgeKey)

  // Get a neon color for this edge
  const colorIndex = (city1Id.charCodeAt(0) + city2Id.charCodeAt(0)) % neonColors.length
  const edgeColor = neonColors[colorIndex]

  // Calculate a random curve offset based on the edge index
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  // Safely calculate distance2D with fallback
  const distance2D = Math.sqrt(dx * dx + dy * dy) || 0.001

  // Vary curve based on edge index for better distribution
  const curveDirection = index % 2 === 0 ? 1 : -1
  
  // Safer curve magnitude calculation with bounds
  const curveMagnitude = Math.min(0.2 + (index % 3) * 0.1, 0.4) // Vary between 0.2, 0.3, and 0.4, max 0.4
  
  // Safely calculate perpendicular components
  const perpX = distance2D !== 0 ? -dy / distance2D : 0
  const perpY = distance2D !== 0 ? dx / distance2D : 0

  // Calculate control point for quadratic curve with bounds
  const midX = (pos1.x + pos2.x) / 2
  const midY = (pos1.y + pos2.y) / 2
  
  // Limit the curve control point displacement to avoid extreme values
  const maxCurveDisplacement = Math.min(distance2D * 0.5, 100)
  const controlX = midX + curveDirection * perpX * Math.min(distance2D * curveMagnitude, maxCurveDisplacement)
  const controlY = midY + curveDirection * perpY * Math.min(distance2D * curveMagnitude, maxCurveDisplacement)

  // Draw the edge with glow effect
  ctx.beginPath()
  ctx.moveTo(pos1.x, pos1.y)
  ctx.quadraticCurveTo(controlX, controlY, pos2.x, pos2.y)

  // Add glow effect
  if (isDarkMode) {
    ctx.shadowColor = edgeColor
    ctx.shadowBlur = 10
    ctx.strokeStyle = edgeColor
    ctx.lineWidth = 2.5 // Slightly thicker line in dark mode
  } else {
    ctx.strokeStyle = edgeColor
    ctx.lineWidth = 3 // Thicker line for better visibility
  }

  ctx.stroke()

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0

  // Draw a flag-like label for the distance
  // Calculate position along the curve
  const t = 0.5 // Position at the middle of the curve
  const labelX = (1 - t) * (1 - t) * pos1.x + 2 * (1 - t) * t * controlX + t * t * pos2.x
  const labelY = (1 - t) * (1 - t) * pos1.y + 2 * (1 - t) * t * controlY + t * t * pos2.y

  // Safely calculate tangent
  const tangentX = 2 * (1 - t) * (controlX - pos1.x) + 2 * t * (pos2.x - controlX)
  const tangentY = 2 * (1 - t) * (controlY - pos1.y) + 2 * t * (pos2.y - controlY)
  const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 0.001

  // Normalize tangent safely
  const normalizedTangentX = tangentLength > 0 ? tangentX / tangentLength : 0
  const normalizedTangentY = tangentLength > 0 ? tangentY / tangentLength : 0

  // Calculate perpendicular direction for flag pole
  const flagPerpX = -normalizedTangentY
  const flagPerpY = normalizedTangentX

  // Flag pole length
  const poleLength = 35 // Longer pole

  // Flag dimensions
  const flagWidth = 45 // Wider flag
  const flagHeight = 25 // Taller flag

  // Draw flag pole
  ctx.beginPath()
  ctx.moveTo(labelX, labelY)
  ctx.lineTo(labelX + flagPerpX * poleLength, labelY + flagPerpY * poleLength)
  ctx.strokeStyle = edgeColor
  ctx.lineWidth = 2 // Thicker pole
  ctx.stroke()

  // Draw flag rectangle
  const flagX = labelX + flagPerpX * poleLength
  const flagY = labelY + flagPerpY * poleLength

  // Create gradient for flag
  const gradient = ctx.createLinearGradient(flagX, flagY, flagX + flagWidth, flagY)
  gradient.addColorStop(0, edgeColor)
  gradient.addColorStop(1, isDarkMode ? "rgba(30, 30, 30, 0.9)" : "rgba(255, 255, 255, 0.9)") // More opaque

  // Draw flag with rounded corners
  ctx.beginPath()
  const cornerRadius = 5

  // Top-left corner
  ctx.moveTo(flagX, flagY)

  // Top edge and top-right corner
  ctx.lineTo(flagX + flagWidth - cornerRadius, flagY)
  ctx.arcTo(flagX + flagWidth, flagY, flagX + flagWidth, flagY + cornerRadius, cornerRadius)

  // Right edge and bottom-right corner
  ctx.lineTo(flagX + flagWidth, flagY + flagHeight - cornerRadius)
  ctx.arcTo(flagX + flagWidth, flagY + flagHeight, flagX + flagWidth - cornerRadius, flagY + flagHeight, cornerRadius)

  // Bottom edge and bottom-left corner
  ctx.lineTo(flagX + cornerRadius, flagY + flagHeight)
  ctx.arcTo(flagX, flagY + flagHeight, flagX, flagY + flagHeight - cornerRadius, cornerRadius)

  // Left edge and back to top-left
  ctx.lineTo(flagX, flagY + cornerRadius)
  ctx.arcTo(flagX, flagY, flagX + cornerRadius, flagY, cornerRadius)

  ctx.fillStyle = gradient
  ctx.fill()

  // Add a border to the flag for better visibility
  ctx.strokeStyle = isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"
  ctx.lineWidth = 1
  ctx.stroke()

  // Draw distance text on flag
  ctx.fillStyle = isDarkMode ? "#FFFFFF" : "#000000"
  ctx.font = "bold 14px Arial" // Larger font
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`${distance} KM`, flagX + flagWidth / 2, flagY + flagHeight / 2)
}

// Draw a route line between cities
function drawRouteLine(
  ctx: CanvasRenderingContext2D,
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  isDarkMode: boolean,
  isOptimal: boolean,
) {
  // Calculate a curve for the route line
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Calculate control point for quadratic curve
  const midX = (pos1.x + pos2.x) / 2
  const midY = (pos1.y + pos2.y) / 2
  const perpX = -dy / distance
  const perpY = dx / distance

  const controlX = midX + perpX * distance * 0.2
  const controlY = midY + perpY * distance * 0.2

  ctx.beginPath()
  ctx.moveTo(pos1.x, pos1.y)
  ctx.quadraticCurveTo(controlX, controlY, pos2.x, pos2.y)

  if (isOptimal) {
    // Optimal route in green with glow
    const optimalColor = "#10B981"
    ctx.strokeStyle = optimalColor
    if (isDarkMode) {
      ctx.shadowColor = optimalColor
      ctx.shadowBlur = 10
    }
    ctx.setLineDash([5, 3])
  } else {
    // User route in purple with glow
    const routeColor = "#8B5CF6"
    ctx.strokeStyle = routeColor
    if (isDarkMode) {
      ctx.shadowColor = routeColor
      ctx.shadowBlur = 10
    }
    ctx.setLineDash([])
  }

  ctx.lineWidth = 4
  ctx.stroke()

  // Reset effects
  ctx.setLineDash([])
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
}

// Draw a city node
function drawCityNode(
  ctx: CanvasRenderingContext2D,
  city: City,
  position: { x: number; y: number },
  isDarkMode: boolean,
  phase: GamePhase,
  isInRoute = false,
  isStartCity = false,
  isHomeCity = false,  // Added isHomeCity parameter
) {
  // Reduced node radius while maintaining good visibility
  const nodeRadius = 25

  // Create a subtle glow effect
  if (isDarkMode) {
    // Choose glow color based on city status - home city gets a gold glow
    ctx.shadowColor = isHomeCity ? "#FFD700" : isStartCity ? "#10B981" : isInRoute ? "#8B5CF6" : city.selected ? "#3B82F6" : "#4B5563"
    ctx.shadowBlur = isHomeCity ? 15 : 12  // Stronger glow for home city
  }

  // Draw city circle with gradient
  const gradient = ctx.createRadialGradient(
    position.x - nodeRadius * 0.3,
    position.y - nodeRadius * 0.3,
    nodeRadius * 0.1,
    position.x,
    position.y,
    nodeRadius,
  )

  if (isHomeCity) {
    // Home city in gold
    gradient.addColorStop(0, isDarkMode ? "#FFDF00" : "#FFD700")  // Gold
    gradient.addColorStop(1, isDarkMode ? "#B8860B" : "#DAA520")  // Darker gold
  } else if (isStartCity) {
    // Start city in green
    gradient.addColorStop(0, isDarkMode ? "#34D399" : "#10B981")
    gradient.addColorStop(1, isDarkMode ? "#059669" : "#047857")
  } else if (isInRoute) {
    // Cities in route in purple
    gradient.addColorStop(0, isDarkMode ? "#A78BFA" : "#8B5CF6")
    gradient.addColorStop(1, isDarkMode ? "#7C3AED" : "#6D28D9")
  } else if (phase === GamePhase.CITY_SELECTION && city.selected) {
    // Selected cities in blue
    gradient.addColorStop(0, isDarkMode ? "#93C5FD" : "#3B82F6")
    gradient.addColorStop(1, isDarkMode ? "#2563EB" : "#1D4ED8")
  } else {
    // Unvisited cities in gray
    gradient.addColorStop(0, isDarkMode ? "#9CA3AF" : "#6B7280") 
    gradient.addColorStop(1, isDarkMode ? "#4B5563" : "#374151")
  }

  ctx.beginPath()
  ctx.arc(position.x, position.y, nodeRadius, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // Add a subtle border - gold for home city
  ctx.strokeStyle = isHomeCity 
    ? (isDarkMode ? "rgba(255, 215, 0, 0.8)" : "rgba(218, 165, 32, 0.8)")  
    : (isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)")
  ctx.lineWidth = isHomeCity ? 3 : 2  // Thicker border for home city
  ctx.stroke()

  // Add an inner ring for selected cities for better visual feedback
  if (phase === GamePhase.CITY_SELECTION && city.selected) {
    ctx.beginPath()
    ctx.arc(position.x, position.y, nodeRadius - 5, 0, Math.PI * 2)
    ctx.strokeStyle = isDarkMode ? "#FFFFFF" : "#000000"
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // Add a "home" indicator for home city
  if (isHomeCity) {
    // Draw a home icon or symbol
    const homeSize = 10;
    
    // Draw a little house shape
    ctx.beginPath();
    // Roof
    ctx.moveTo(position.x, position.y - nodeRadius - 5);
    ctx.lineTo(position.x - homeSize, position.y - nodeRadius + 5);
    ctx.lineTo(position.x + homeSize, position.y - nodeRadius + 5);
    ctx.closePath();
    
    ctx.fillStyle = isDarkMode ? "#FFF" : "#000";
    ctx.fill();
    
    // House body
    ctx.fillRect(
      position.x - homeSize * 0.7, 
      position.y - nodeRadius + 5, 
      homeSize * 1.4, 
      homeSize * 0.8
    );
  }

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0

  // Draw city label
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(city.id, position.x, position.y)
}

// Draw a map-like background
function drawMapBackground(ctx: CanvasRenderingContext2D, width: number, height: number, isDarkMode: boolean) {
  // Fill background
  ctx.fillStyle = isDarkMode ? "#111827" : "#F9FAFB"
  ctx.fillRect(0, 0, width, height)

  // Draw subtle grid
  ctx.strokeStyle = isDarkMode ? "rgba(75, 85, 99, 0.1)" : "rgba(209, 213, 219, 0.2)"
  ctx.lineWidth = 1

  // Horizontal grid lines
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Vertical grid lines
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
}
