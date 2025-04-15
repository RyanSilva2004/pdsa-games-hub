"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { City } from "../logic/types"
import { GamePhase } from "../logic/types"
import type { AdjacencyMatrix } from "../logic/adjacency-matrix"
import { mdsClassic } from "../util/mds"

interface CityMapProps {
  phase: GamePhase
  cities: City[]
  adjacencyMatrix?: AdjacencyMatrix | null
  currentRoute?: string[]
  onCitySelect?: (cityId: string) => void
  onMapReady?: () => void
  highlightRoute?: string[]
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
}: CityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [cityPositions, setCityPositions] = useState<Record<string, { x: number; y: number }>>({})

  // Calculate city positions based on distances
  useEffect(() => {
    if (!cities.length || Object.keys(cityPositions).length > 0) {
      return // Skip if we already have positions or no cities
    }

    setIsAnimating(true)

    // Calculate initial positions using force-directed placement
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Clear canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw map background
    const isDarkMode = theme === "dark"
    drawMapBackground(ctx, width, height, isDarkMode)

    // Calculate positions incrementally
    calculateAndAnimatePositions(ctx, cities, adjacencyMatrix, width, height, isDarkMode, phase, () => {
      // Notify parent that map visualization is complete
      if (phase === GamePhase.MAP_VISUALIZATION && onMapReady) {
        onMapReady()
      }
    })
  }, [cities, adjacencyMatrix, theme, phase, onMapReady])

  // Draw the current route when it changes
  useEffect(() => {
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
    )
  }, [cities, cityPositions, adjacencyMatrix, theme, currentRoute, isAnimating, highlightRoute, phase])

  // Calculate and animate city positions
  const calculateAndAnimatePositions = (
    ctx: CanvasRenderingContext2D,
    cities: City[],
    adjacencyMatrix: AdjacencyMatrix | null | undefined,
    width: number,
    height: number,
    isDarkMode: boolean,
    phase: GamePhase,
    onComplete: () => void,
  ) => {
    // If we have an adjacency matrix, use MDS for true distance-based layout
    if (adjacencyMatrix && cities.length > 1) {
      // Build distance matrix
      const cityIds = cities.map(c => c.id);
      const distMatrix = cityIds.map(id1 => cityIds.map(id2 => adjacencyMatrix.getDistance(id1, id2)));
      // Run MDS
      const mdsCoords = mdsClassic(distMatrix, 2);
      // Find bounds
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      mdsCoords.forEach(({x, y}) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
      // Scale and center to fit canvas
      const padding = 60;
      const plotW = width - 2 * padding;
      const plotH = height - 2 * padding;
      const scaleX = plotW / (maxX - minX || 1);
      const scaleY = plotH / (maxY - minY || 1);
      const scale = Math.min(scaleX, scaleY);
      const positions: Record<string, { x: number; y: number }> = {};
      mdsCoords.forEach((coord, i) => {
        positions[cityIds[i]] = {
          x: padding + (coord.x - minX) * scale,
          y: padding + (coord.y - minY) * scale,
        };
      });
      setCityPositions(positions);
      setIsAnimating(false);
      onComplete();
      return;
    }
    // Calculate a global scale factor for visualization based on canvas size
    const calculateScaleFactor = (cities: City[], adjacencyMatrix: AdjacencyMatrix | null | undefined, width: number, height: number) => {
      if (!adjacencyMatrix) return 1;
      
      // Find total sum of distances and max distance
      let totalDistance = 0;
      let maxDistance = 0;
      let minDistance = Infinity;
      let connections = 0;
      
      for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
          const dist = adjacencyMatrix.getDistance(cities[i].id, cities[j].id);
          totalDistance += dist;
          maxDistance = Math.max(maxDistance, dist);
          minDistance = Math.min(minDistance, dist);
          connections++;
        }
      }
      
      // Available canvas space with minimal padding
      const padding = 60; // Reduced padding to use more space
      const availableWidth = width - 2 * padding;
      const availableHeight = height - 2 * padding;
      
      // Calculate average distance
      const avgDistance = connections > 0 ? totalDistance / connections : 50;
      const cityCount = cities.length;
      
      // Use a much more aggressive scaling factor to spread cities wider
      // For fewer cities, we can use an even larger scale
      const baseScaleFactor = 0.8; // Lower is more spread out
      const cityCountFactor = 10 / (cityCount + 5); // More spread for fewer cities
      
      // Calculate scale based on canvas size and distances
      // We want the graph to use at least 75-80% of the canvas
      const canvasDimension = Math.min(availableWidth, availableHeight);
      
      // Make largest distance take up a significant portion of the canvas
      // More cities = slightly smaller scale to prevent overlap
      const scaleFactor = (canvasDimension * 0.75) / (maxDistance * baseScaleFactor) * cityCountFactor;
      
      console.log(`Canvas: ${width}x${height}, Cities: ${cityCount}, Scale: ${scaleFactor.toFixed(3)}, Max Dist: ${maxDistance}, Min Dist: ${minDistance}`);
      
      // Return a larger scale factor to spread cities more
      return Math.min(Math.max(scaleFactor, 1.0), 12.0);  // Higher minimum and maximum
    };

    // Calculate the scale factor once at initialization - this is critical to ensure consistent visualization
    const globalScaleFactor = calculateScaleFactor(cities, adjacencyMatrix, width, height);

    // Initial positions in a circle with spacing based on canvas
    const positions: Record<string, { x: number; y: number }> = {}
    const padding = 100; // Safe padding from edges
    const effectiveWidth = width - 2 * padding;
    const effectiveHeight = height - 2 * padding;
    const centerX = width / 2;
    const centerY = height / 2;

    // Use radius based on available space and number of cities
    const radius = Math.min(effectiveWidth, effectiveHeight) * 0.4;

    // Place cities in a circle
    cities.forEach((city, index) => {
      const angle = (index / cities.length) * 2 * Math.PI;
      positions[city.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Save the global scale factor for use in force calculations
    const scaledDistances: Record<string, Record<string, number>> = {};
    
    if (adjacencyMatrix) {
      // Pre-compute scaled distances once to avoid repeated calculations
      cities.forEach(city1 => {
        scaledDistances[city1.id] = {};
        cities.forEach(city2 => {
          if (city1.id !== city2.id) {
            // Scale the distance by our global factor
            scaledDistances[city1.id][city2.id] = 
              adjacencyMatrix.getDistance(city1.id, city2.id) * globalScaleFactor;
          }
        });
      });
    }

    // Animate adding cities one by one
    let currentCityIndex = 0;
    const addedCities: string[] = [];
    const drawnEdges = new Set<string>();

    const addNextCity = () => {
      if (currentCityIndex >= cities.length) {
        // All cities added, now optimize positions if we have an adjacency matrix
        if (adjacencyMatrix) {
          // Pass the scaled distances to the optimization function
          optimizePositions(
            positions, 
            cities, 
            adjacencyMatrix, 
            width, 
            height, 
            addedCities, 
            scaledDistances, 
            (newPositions) => {
              setCityPositions(newPositions);
              setIsAnimating(false);
              onComplete();
            }
          );
        } else {
          setCityPositions(positions);
          setIsAnimating(false);
          onComplete();
        }
        return;
      }

      const currentCity = cities[currentCityIndex];
      addedCities.push(currentCity.id);

      // Draw connections to all previously added cities if we have an adjacency matrix
      if (adjacencyMatrix) {
        for (let i = 0; i < currentCityIndex; i++) {
          const previousCity = cities[i];
          const distance = adjacencyMatrix.getDistance(previousCity.id, currentCity.id);

          drawConnection(
            ctx,
            positions[previousCity.id],
            positions[currentCity.id],
            distance,
            i,
            isDarkMode,
            drawnEdges,
            previousCity.id,
            currentCity.id,
          );
        }
      }

      // Draw the city node
      drawCityNode(ctx, currentCity, positions[currentCity.id], isDarkMode, phase);

      // Update positions based on forces if we have an adjacency matrix
      if (adjacencyMatrix && currentCityIndex > 0) {
        const tempPositions = { ...positions };
        
        // Use the scaled distances in force calculation
        applyForces(tempPositions, addedCities, adjacencyMatrix, width, height, scaledDistances);

        // Redraw everything with updated positions
        ctx.clearRect(0, 0, width, height);
        drawMapBackground(ctx, width, height, isDarkMode);

        // Redraw all edges
        drawnEdges.clear();
        for (let i = 0; i < addedCities.length; i++) {
          for (let j = i + 1; j < addedCities.length; j++) {
            const city1 = addedCities[i];
            const city2 = addedCities[j];
            const distance = adjacencyMatrix.getDistance(city1, city2);

            drawConnection(
              ctx,
              tempPositions[city1],
              tempPositions[city2],
              distance,
              i * cities.length + j,
              isDarkMode,
              drawnEdges,
              city1,
              city2,
            );
          }
        }

        // Redraw all cities
        for (let i = 0; i < addedCities.length; i++) {
          const cityId = addedCities[i];
          const city = cities.find((c) => c.id === cityId);
          if (city) {
            drawCityNode(ctx, city, tempPositions[cityId], isDarkMode, phase);
          }
        }

        // Update positions
        Object.assign(positions, tempPositions);
      }

      // Move to next city
      currentCityIndex++;

      // Schedule next city with a delay
      setTimeout(addNextCity, 300);
    };

    // Start the animation
    addNextCity();
  }

  // Apply forces to optimize positions
  const applyForces = (
    positions: Record<string, { x: number; y: number }>,
    cityIds: string[],
    adjacencyMatrix: AdjacencyMatrix,
    width: number,
    height: number,
    scaledDistances: Record<string, Record<string, number>>,
  ) => {
    // Safe padding to keep cities away from edges
    const padding = 100
    const forces: Record<string, { x: number; y: number }> = {}

    // Initialize forces
    cityIds.forEach((cityId) => {
      forces[cityId] = { x: 0, y: 0 }
    })

    // Apply distance-based forces using pre-scaled distances
    cityIds.forEach((city1) => {
      cityIds.forEach((city2) => {
        if (city1 === city2) return

        const pos1 = positions[city1]
        const pos2 = positions[city2]

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        // Ensure we don't divide by zero
        const actualDistance = Math.sqrt(dx * dx + dy * dy) || 0.001

        // Get the pre-scaled desired distance - this already has the canvas size factor built in
        const desiredDistance = scaledDistances[city1][city2]
        
        // Calculate force - use a small coefficient to prevent overshooting
        const forceMagnitude = ((actualDistance - desiredDistance) / actualDistance) * 0.2
        
        // Apply bounded forces
        forces[city1].x += dx * forceMagnitude
        forces[city1].y += dy * forceMagnitude
        forces[city2].x -= dx * forceMagnitude
        forces[city2].y -= dy * forceMagnitude
      })
    })

    // Apply repulsive forces to prevent overlapping - based on number of cities
    const nodeRadius = 25 // Match the node radius in drawCityNode
    const minSeparation = nodeRadius * 3 // Ensure at least 3x node radius between cities
    
    cityIds.forEach((city1) => {
      cityIds.forEach((city2) => {
        if (city1 === city2) return

        const pos1 = positions[city1]
        const pos2 = positions[city2]

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001

        // Strong repulsion when cities are too close
        if (distance < minSeparation) {
          // Safe repulsion calculation
          const repulsionStrength = Math.min(1.5 * (1 - distance / minSeparation) / distance, 0.5)
          
          forces[city1].x -= dx * repulsionStrength
          forces[city1].y -= dy * repulsionStrength
          forces[city2].x += dx * repulsionStrength
          forces[city2].y += dy * repulsionStrength
        }
      })
    })

    // Apply boundary forces to keep cities within canvas
    cityIds.forEach((cityId) => {
      const pos = positions[cityId]

      // Strong correction if outside boundaries
      if (pos.x < padding) {
        forces[cityId].x += 0.5 * (padding - pos.x)
      }
      if (pos.x > width - padding) {
        forces[cityId].x -= 0.5 * (pos.x - (width - padding))
      }
      if (pos.y < padding) {
        forces[cityId].y += 0.5 * (padding - pos.y)
      }
      if (pos.y > height - padding) {
        forces[cityId].y -= 0.5 * (pos.y - (height - padding))
      }
    })

    // Add weak central gravity to prevent cities from drifting too far apart
    const centerX = width / 2
    const centerY = height / 2
    const gravitationalConstant = 0.0005
    
    cityIds.forEach((cityId) => {
      const pos = positions[cityId]
      const dx = centerX - pos.x
      const dy = centerY - pos.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.001
      
      forces[cityId].x += (dx / distance) * gravitationalConstant * distance
      forces[cityId].y += (dy / distance) * gravitationalConstant * distance
    })

    // Apply forces with damping and capping to prevent instability
    const damping = 0.7
    cityIds.forEach((cityId) => {
      const force = forces[cityId]
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y)
      
      // Cap maximum force to prevent extreme movements
      const maxForce = 10
      if (magnitude > maxForce) {
        const scale = maxForce / magnitude
        force.x *= scale
        force.y *= scale
      }
      
      // Apply damped force
      positions[cityId].x += force.x * damping
      positions[cityId].y += force.y * damping
    })
  }

  // Optimize positions using force-directed algorithm
  const optimizePositions = (
    initialPositions: Record<string, { x: number; y: number }>,
    cities: City[],
    adjacencyMatrix: AdjacencyMatrix,
    width: number,
    height: number,
    cityIds: string[],
    scaledDistances: Record<string, Record<string, number>>,
    callback: (positions: Record<string, { x: number; y: number }>) => void,
  ) => {
     // Make a deep copy to preserve initial positions
    const positions = JSON.parse(JSON.stringify(initialPositions));
    
    // Save a copy of initial positions to blend with during optimization
    // This helps maintain the initial structure and prevents collapse
    const originalPositions = JSON.parse(JSON.stringify(initialPositions));
    
    // Fewer iterations to avoid over-optimization which can lead to collapse
    const baseIterations = 80
    const cityCount = cityIds.length
    const iterations = baseIterations + cityCount * 5
    
    // Track convergence to avoid unnecessary iterations
    let stabilityCounter = 0
    let previousPositions: Record<string, { x: number; y: number }> = {}
    let currentIteration = 0

    // Copy current positions
    cityIds.forEach(id => {
      previousPositions[id] = { ...positions[id] }
    })
    
    // Debug logging
    console.log("Starting optimization with", cityCount, "cities and", iterations, "iterations");
    
    // Function to check if any cities are too close to each other
    const checkCityProximity = () => {
      const minAcceptableDistance = 50; // Minimum distance between cities
      let tooClose = false;
      
      // Check distances between all city pairs
      for (let i = 0; i < cityIds.length; i++) {
        for (let j = i + 1; j < cityIds.length; j++) {
          const city1 = cityIds[i];
          const city2 = cityIds[j];
          const pos1 = positions[city1];
          const pos2 = positions[city2];
          
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minAcceptableDistance) {
            tooClose = true;
            // Apply a separation force
            const separation = (minAcceptableDistance - distance) / 2;
            const angle = Math.atan2(dy, dx);
            
            pos1.x -= separation * Math.cos(angle);
            pos1.y -= separation * Math.sin(angle);
            pos2.x += separation * Math.cos(angle);
            pos2.y += separation * Math.sin(angle);
          }
        }
      }
      
      return tooClose;
    }

    const runIteration = () => {
      // Stop conditions: max iterations or stable configuration
      if (currentIteration >= iterations || stabilityCounter >= 10) {
        // Final sanity checks and adjustments
        const spreadFactor = checkAndFixCollapse(positions, originalPositions, width, height);
        if (spreadFactor > 1) {
          console.log(`Applied collapse fix with spread factor: ${spreadFactor}`);
        }
        
        // Fix any cities that are too close to each other
        for (let i = 0; i < 5; i++) {
          if (!checkCityProximity()) break;
        }
        
        // Ensure all cities are within bounds
        ensureCitiesInBounds(positions, width, height, 60)
        
        // Check for non-finite positions
        cityIds.forEach(id => {
          if (!isFinite(positions[id].x) || !isFinite(positions[id].y)) {
            console.warn(`Found non-finite position for city ${id}, resetting to original position`);
            positions[id] = { ...originalPositions[id] };
          }
        })
        
        console.log("Optimization complete after", currentIteration, "iterations");
        callback(positions);
        return;
      }

      // Progressive strength - start strong then fade, encourages convergence
      // but avoids destruction of initial structure
      const progressFactor = Math.max(0.1, 1 - (currentIteration / iterations) * 1.2);
      
      // Apply forces
      applyForcesWithStrength(positions, cityIds, adjacencyMatrix, width, height, progressFactor, scaledDistances);
      
      // Blend with original positions to maintain structure
      // This is critical to prevent collapse - weight decreases over time
      const originalWeight = Math.max(0, 0.2 - (currentIteration / iterations) * 0.2);
      if (originalWeight > 0) {
        cityIds.forEach(id => {
          positions[id].x = positions[id].x * (1 - originalWeight) + originalPositions[id].x * originalWeight;
          positions[id].y = positions[id].y * (1 - originalWeight) + originalPositions[id].y * originalWeight;
        });
      }
      
      currentIteration++;

      // Check if positions have stabilized
      let totalMovement = 0;
      cityIds.forEach(id => {
        const dx = positions[id].x - previousPositions[id].x;
        const dy = positions[id].y - previousPositions[id].y;
        totalMovement += Math.sqrt(dx * dx + dy * dy);
        
        // Update previous positions
        previousPositions[id] = { ...positions[id] };
      });
      
      // If movement is very small, increment stability counter
      if (totalMovement / cityIds.length < 0.5) {
        stabilityCounter++;
      } else {
        stabilityCounter = 0;
      }

      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(runIteration);
    }
    
    // Function to check if cities have collapsed and fix it
    const checkAndFixCollapse = (
      positions: Record<string, { x: number; y: number }>,
      originalPositions: Record<string, { x: number; y: number }>,
      width: number,
      height: number
    ) => {
      // Find the current spread of cities
      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;
      
      Object.values(positions).forEach(pos => {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minY = Math.min(minY, pos.y);
        maxY = Math.max(maxY, pos.y);
      });
      
      const spreadX = maxX - minX;
      const spreadY = maxY - minY;
      
      // If spread is too small, cities have collapsed
      const minSpread = Math.min(width, height) * 0.4; // Cities should take up at least 40% of canvas
      
      if (spreadX < minSpread || spreadY < minSpread) {
        console.warn("Detected city collapse! Fixing...");
        
        // Calculate center of current positions
        let centerX = (minX + maxX) / 2;
        let centerY = (minY + maxY) / 2;
        
        // Calculate spread factor needed
        const spreadFactor = Math.max(
          minSpread / Math.max(1, spreadX),
          minSpread / Math.max(1, spreadY)
        ) * 1.2; // Add 20% extra space
        
        // Apply spread transformation from the center
        Object.keys(positions).forEach(cityId => {
          const dx = positions[cityId].x - centerX;
          const dy = positions[cityId].y - centerY;
          
          positions[cityId].x = centerX + dx * spreadFactor;
          positions[cityId].y = centerY + dy * spreadFactor;
        });
        
        return spreadFactor;
      }
      
      return 1; // No spread needed
    };

    // Start the optimization process
    runIteration();
  }

  // Ensure all cities are within the canvas boundaries
  const ensureCitiesInBounds = (
    positions: Record<string, { x: number; y: number }>,
    width: number,
    height: number,
    padding: number
  ) => {
    Object.keys(positions).forEach(cityId => {
      const pos = positions[cityId]
      
      // Adjust x position if too close to edges
      if (pos.x < padding) {
        pos.x = padding
      } else if (pos.x > width - padding) {
        pos.x = width - padding
      }
      
      // Adjust y position if too close to edges
      if (pos.y < padding) {
        pos.y = padding
      } else if (pos.y > height - padding) {
        pos.y = height - padding
      }
    })
  }
  
  // Apply forces with a strength factor
  const applyForcesWithStrength = (
    positions: Record<string, { x: number; y: number }>,
    cityIds: string[],
    adjacencyMatrix: AdjacencyMatrix,
    width: number,
    height: number,
    strengthFactor: number,
    scaledDistances: Record<string, Record<string, number>>,
  ) => {
    const tempPositions = { ...positions }
    applyForces(tempPositions, cityIds, adjacencyMatrix, width, height, scaledDistances)
    
    // Apply changes with gradually decreasing strength
    cityIds.forEach(id => {
      positions[id].x += (tempPositions[id].x - positions[id].x) * strengthFactor
      positions[id].y += (tempPositions[id].y - positions[id].y) * strengthFactor
    })
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

    drawCityNode(ctx, city, cityPositions[city.id], isDarkMode, phase, isInRoute, isStartCity)
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
) {
  // Reduced node radius while maintaining good visibility
  const nodeRadius = 25

  // Create a subtle glow effect
  if (isDarkMode) {
    ctx.shadowColor = isStartCity ? "#10B981" : isInRoute ? "#8B5CF6" : city.selected ? "#3B82F6" : "#4B5563"
    ctx.shadowBlur = 12
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

  if (isStartCity) {
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

  // Add a subtle border
  ctx.strokeStyle = isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"
  ctx.lineWidth = 2
  ctx.stroke()

  // Add an inner ring for selected cities for better visual feedback
  if (phase === GamePhase.CITY_SELECTION && city.selected) {
    ctx.beginPath()
    ctx.arc(position.x, position.y, nodeRadius - 5, 0, Math.PI * 2)
    ctx.strokeStyle = isDarkMode ? "#FFFFFF" : "#000000"
    ctx.lineWidth = 1.5
    ctx.stroke()
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
