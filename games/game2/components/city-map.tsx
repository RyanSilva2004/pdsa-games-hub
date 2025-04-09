"use client"

import { useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import type { City } from "../logic/types"

interface CityMapProps {
  cities: City[]
  distanceMatrix: Record<string, Record<string, number>>
  onReload?: () => void
}

export function CityMap({ cities, distanceMatrix, onReload }: CityMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)

  // Draw the cities and connections on the canvas
  useEffect(() => {
    if (Object.keys(distanceMatrix).length === 0) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Determine if we're in dark mode
    const isDarkMode = theme === "dark"

    // Draw map background
    drawMapBackground(ctx, canvas.width, canvas.height, isDarkMode)

    // Calculate city positions based on distances
    const cityPositions = calculateCityPositions(cities, distanceMatrix, canvas.width, canvas.height)

    // Animate the building of the map
    animateBuildingMap(ctx, cities, cityPositions, distanceMatrix, isDarkMode)
  }, [cities, distanceMatrix, theme])

  // Generate the map in a larger area and enable zoom and pan
  useEffect(() => {
    if (Object.keys(distanceMatrix).length === 0 || isAnimating) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Store the original city positions for redrawing
    const originalCityPositions = calculateCityPositions(cities, distanceMatrix, canvas.width, canvas.height);
    const isDarkMode = theme === "dark";

    // Initialize zoom and pan variables
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // Function to redraw the entire map with current scale and offset
    const redrawMap = () => {
      // Clear canvas with transform reset
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply the current transform
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
      
      // Draw the map background
      drawMapBackground(ctx, canvas.width / scale, canvas.height / scale, isDarkMode);
      
      // Draw all edges first (so they appear under nodes)
      const drawnEdges = new Set<string>();
      cities.forEach((city1, i) => {
        cities.forEach((city2, j) => {
          if (i < j) { // Only draw each edge once
            const distance = distanceMatrix[city1.id][city2.id];
            drawConnection(
              ctx,
              originalCityPositions[city1.id],
              originalCityPositions[city2.id],
              distance,
              i * cities.length + j,
              isDarkMode,
              drawnEdges
            );
          }
        });
      });
      
      // Draw all city nodes (on top of edges)
      cities.forEach((city) => {
        drawCityNode(ctx, city, originalCityPositions[city.id], isDarkMode);
      });
    };

    // Initial draw
    redrawMap();

    // Event handlers for zooming and panning
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      
      // Determine zoom direction and factor
      const zoomFactor = 1.1;
      const zoom = event.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
      
      // Get mouse position relative to canvas
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Calculate new scale
      const newScale = Math.min(Math.max(scale * zoom, 0.5), 5); // Limit zoom range
      
      // Calculate new offset to zoom centered on mouse position
      offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
      offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);
      scale = newScale;
      
      // Redraw with new scale and offset
      redrawMap();
    };

    const handleMouseDown = (event: MouseEvent) => {
      // Only activate on left mouse button
      if (event.button === 0) {
        isDragging = true;
        dragStartX = event.clientX - offsetX;
        dragStartY = event.clientY - offsetY;
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        offsetX = event.clientX - dragStartX;
        offsetY = event.clientY - dragStartY;
        redrawMap();
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
      }
    };

    // Add event listeners
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.style.cursor = 'grab'; // Set default cursor

    // Remove event listeners on cleanup
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cities, distanceMatrix, theme, isAnimating]);

  // Improve city positioning by increasing repulsion between cities
  const calculateCityPositions = (
    cities: City[],
    distanceMatrix: Record<string, Record<string, number>>,
    width: number,
    height: number,
  ) => {
    const positions: Record<string, { x: number; y: number }> = {}
    const padding = 100 // Increased padding from edges for better spacing
    const effectiveWidth = width - 2 * padding
    const effectiveHeight = height - 2 * padding

    // Find the maximum distance to scale positions
    let maxDistance = 0
    for (const cityId1 in distanceMatrix) {
      for (const cityId2 in distanceMatrix[cityId1]) {
        if (distanceMatrix[cityId1][cityId2] > maxDistance) {
          maxDistance = distanceMatrix[cityId1][cityId2]
        }
      }
    }

    // Scale factor to convert distances to pixels - further reduced to spread cities out more
    const scaleFactor = Math.min(effectiveWidth, effectiveHeight) / (maxDistance * 0.5)

    // Place cities in a circular pattern initially for better distribution
    cities.forEach((city, index) => {
      const angle = (index / cities.length) * 2 * Math.PI
      const radius = Math.min(effectiveWidth, effectiveHeight) * 0.4 // Use 40% of available space for the circle
      
      positions[city.id] = {
        x: padding + effectiveWidth / 2 + radius * Math.cos(angle),
        y: padding + effectiveHeight / 2 + radius * Math.sin(angle),
      }
    })

    // Now optimize positions based on distances
    const iterations = 300 // Increased iterations for better convergence
    const learningRate = 0.05

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate forces based on distance constraints
      const forces: Record<string, { x: number; y: number }> = {}

      for (const cityId in positions) {
        forces[cityId] = { x: 0, y: 0 }
      }

      // Apply forces based on distance constraints
      for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
          const city1 = cities[i]
          const city2 = cities[j]

          const pos1 = positions[city1.id]
          const pos2 = positions[city2.id]

          const desiredDistance = distanceMatrix[city1.id][city2.id] * scaleFactor

          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const actualDistance = Math.sqrt(dx * dx + dy * dy)

          if (actualDistance === 0) continue

          const force = (actualDistance - desiredDistance) / actualDistance
          const forceX = dx * force
          const forceY = dy * force

          // Apply force with decreasing learning rate over iterations
          const currentLearningRate = learningRate * (1 - iter / iterations)

          forces[city1.id].x += forceX * currentLearningRate
          forces[city1.id].y += forceY * currentLearningRate
          forces[city2.id].x -= forceX * currentLearningRate
          forces[city2.id].y -= forceY * currentLearningRate
        }
      }

      // Apply repulsive forces to prevent overlapping
      const repulsionDistance = 120 // Increased from 80 to push cities further apart
      const repulsionStrength = 8 // Increased from 5 for stronger repulsion

      for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
          const city1 = cities[i]
          const city2 = cities[j]

          const pos1 = positions[city1.id]
          const pos2 = positions[city2.id]

          const dx = pos2.x - pos1.x
          const dy = pos2.y - pos1.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < repulsionDistance && distance > 0) {
            const force = (repulsionStrength * (1 - distance / repulsionDistance)) / distance
            const forceX = dx * force
            const forceY = dy * force

            forces[city1.id].x -= forceX
            forces[city1.id].y -= forceY
            forces[city2.id].x += forceX
            forces[city2.id].y += forceY
          }
        }
      }

      // Apply boundary forces to keep cities within canvas
      const boundaryForce = 0.15 // Increased to strengthen boundary enforcement
      for (const cityId in positions) {
        const pos = positions[cityId]

        if (pos.x < padding) {
          forces[cityId].x += boundaryForce * (padding - pos.x)
        }
        if (pos.x > width - padding) {
          forces[cityId].x -= boundaryForce * (pos.x - (width - padding))
        }
        if (pos.y < padding) {
          forces[cityId].y += boundaryForce * (padding - pos.y)
        }
        if (pos.y > height - padding) {
          forces[cityId].y -= boundaryForce * (pos.y - (height - padding))
        }
      }

      // Update positions
      for (const cityId in positions) {
        positions[cityId].x += forces[cityId].x
        positions[cityId].y += forces[cityId].y
      }
    }

    return positions
  }

  // Animate building the map city by city
  const animateBuildingMap = (
    ctx: CanvasRenderingContext2D,
    cities: City[],
    cityPositions: Record<string, { x: number; y: number }>,
    distanceMatrix: Record<string, Record<string, number>>,
    isDarkMode: boolean,
  ) => {
    setIsAnimating(true)

    // Draw cities and connections incrementally
    let currentCityIndex = 0
    let connectionIndex = 0
    const drawnEdges = new Set<string>() // Track drawn edges to avoid duplicates

    const drawNextCity = () => {
      if (currentCityIndex >= cities.length) {
        // All cities drawn, now draw the labels
        drawOptimizedEdgeLabels(ctx, cities, cityPositions, distanceMatrix, isDarkMode)
        setIsAnimating(false)
        return
      }

      // Draw connections to all previously placed cities
      const currentCity = cities[currentCityIndex]

      for (let i = 0; i < currentCityIndex; i++) {
        const previousCity = cities[i]
        const distance = distanceMatrix[previousCity.id][currentCity.id]
        drawConnection(
          ctx,
          cityPositions[previousCity.id],
          cityPositions[currentCity.id],
          distance,
          connectionIndex++,
          isDarkMode,
          drawnEdges,
        )
      }

      // Draw the current city
      drawCityNode(ctx, currentCity, cityPositions[currentCity.id], isDarkMode)

      // Move to next city
      currentCityIndex++

      // Schedule next city with a delay
      setTimeout(drawNextCity, 300)
    }

    // Start the animation
    drawNextCity()
  }

  // Update road colors to include more unique neon-style variations
  const roadColors = [
    "#FF00FF", "#00FFFF", "#FF9900", "#00FF00", "#FF0000", "#FFFF00", "#FF1493", "#00FF7F", "#1E90FF", "#FF4500",
    "#9400D3", "#00CED1", "#FFD700", "#ADFF2F", "#FF6347", "#7FFF00", "#FF69B4", "#40E0D0", "#8A2BE2", "#DC143C"
  ];

  // Greatly improved edge drawing with smart label placement to minimize overlaps
  const drawConnection = (
    ctx: CanvasRenderingContext2D,
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
    distance: number,
    index: number,
    isDarkMode: boolean,
    drawnEdges: Set<string>, // Track drawn edges to avoid duplicates
  ) => {
    // Create a unique key for the edge
    const edgeKey = `${Math.min(pos1.x, pos2.x)}-${Math.max(pos1.x, pos2.x)}-${Math.min(pos1.y, pos2.y)}-${Math.max(pos1.y, pos2.y)}`;

    // Skip if this edge has already been drawn
    if (drawnEdges.has(edgeKey)) {
      return;
    }
    drawnEdges.add(edgeKey);

    // Select a color based on the index
    const color = roadColors[index % roadColors.length];

    // Adjust the starting and ending points to begin under the vertices
    const nodeRadius = 26; // Radius of the city nodes slightly larger than the actual node
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const distanceToAdjust = Math.sqrt(dx * dx + dy * dy);
    const adjustX = (dx / distanceToAdjust) * nodeRadius;
    const adjustY = (dy / distanceToAdjust) * nodeRadius;

    const adjustedPos1 = { x: pos1.x + adjustX, y: pos1.y + adjustY };
    const adjustedPos2 = { x: pos2.x - adjustX, y: pos2.y - adjustY };

    // Calculate the direct distance between the adjusted positions
    const directDistance = Math.sqrt(
      Math.pow(adjustedPos2.x - adjustedPos1.x, 2) + 
      Math.pow(adjustedPos2.y - adjustedPos1.y, 2)
    );

    // Vary curve offset based on edge length to improve visibility of shorter edges
    const curveOffsetBase = Math.min(directDistance * 0.35, 60);
    // Use index to vary curve direction and magnitude for better distinction between edges
    const curveMultiplier = 1 + (index % 5) * 0.2;
    const curveOffset = curveOffsetBase * curveMultiplier;
    
    // Alternate the curve direction based on the index to distribute edges better
    const angleOffset = (index % 2 === 0) ? Math.PI / 2 : -Math.PI / 2;
    const angle = Math.atan2(adjustedPos2.y - adjustedPos1.y, adjustedPos2.x - adjustedPos1.x) + angleOffset;
    
    // Calculate midpoint
    const midX = (adjustedPos1.x + adjustedPos2.x) / 2;
    const midY = (adjustedPos1.y + adjustedPos2.y) / 2;
    
    // Calculate control point for the curve
    const controlX = midX + curveOffset * Math.cos(angle);
    const controlY = midY + curveOffset * Math.sin(angle);

    // Create a glow effect for the edge
    if (isDarkMode) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Draw the road with a quadratic curve
    ctx.beginPath();
    ctx.moveTo(adjustedPos1.x, adjustedPos1.y);
    ctx.quadraticCurveTo(controlX, controlY, adjustedPos2.x, adjustedPos2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Calculate a good position for the label
    // Position it along the curve, not at the midpoint, to reduce clustering
    // The position varies with index to distribute labels
    const t = 0.5 + (((index % 3) - 1) * 0.1); // Varies between 0.4, 0.5, and 0.6
    const labelPosX = Math.pow(1-t, 2) * adjustedPos1.x + 2 * (1-t) * t * controlX + Math.pow(t, 2) * adjustedPos2.x;
    const labelPosY = Math.pow(1-t, 2) * adjustedPos1.y + 2 * (1-t) * t * controlY + Math.pow(t, 2) * adjustedPos2.y;

    // Calculate tangent angle at the label position for a more natural orientation
    const tangentX = 2 * (1-t) * (controlX - adjustedPos1.x) + 2 * t * (adjustedPos2.x - controlX);
    const tangentY = 2 * (1-t) * (controlY - adjustedPos1.y) + 2 * t * (adjustedPos2.y - controlY);
    const tangentAngle = Math.atan2(tangentY, tangentX);

    // Draw a small connecting line from the edge to the label
    // Offset the label perpendicular to the curve
    const perpAngle = tangentAngle + Math.PI/2;
    const labelOffset = 15 + (index % 3) * 5; // Vary offset to reduce overlaps
    const labelX = labelPosX + labelOffset * Math.cos(perpAngle);
    const labelY = labelPosY + labelOffset * Math.sin(perpAngle);

    // Draw connection line
    ctx.beginPath();
    ctx.moveTo(labelPosX, labelPosY);
    ctx.lineTo(labelX, labelY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label dimensions
    const labelWidth = 40;
    const labelHeight = 20;

    // Draw label background with rounded corners for better aesthetics
    ctx.fillStyle = color;
    const cornerRadius = 5;
    roundRect(
      ctx, 
      labelX - labelWidth/2, 
      labelY - labelHeight/2, 
      labelWidth, 
      labelHeight, 
      cornerRadius
    );

    // Draw the label text
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = isDarkMode ? "#FFFFFF" : "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${distance} KM`, labelX, labelY);
  };

  // Helper function to draw a rounded rectangle
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  // Improved city node drawing for better visibility
  const drawCityNode = (
    ctx: CanvasRenderingContext2D,
    city: City,
    position: { x: number; y: number },
    isDarkMode: boolean,
  ) => {
    // Create a more visually distinct node
    const nodeRadius = 25;
    
    // Draw outer glow/halo
    const gradient = ctx.createRadialGradient(
      position.x, position.y, nodeRadius * 0.7,
      position.x, position.y, nodeRadius * 1.3
    );
    gradient.addColorStop(0, isDarkMode ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.6)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, nodeRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw main purple circle for city with gradient
    const mainGradient = ctx.createRadialGradient(
      position.x - nodeRadius * 0.3, position.y - nodeRadius * 0.3, 0,
      position.x, position.y, nodeRadius
    );
    mainGradient.addColorStop(0, '#A78BFA'); // Lighter purple
    mainGradient.addColorStop(1, '#7C3AED'); // Darker purple

    // Add shadow for depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, nodeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add a subtle border
    ctx.strokeStyle = isDarkMode ? "#C4B5FD" : "#4C1D95";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(position.x, position.y, nodeRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw city label with background for better readability
    // First draw a small semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    const textWidth = ctx.measureText(`City ${city.id}`).width;
    const textPadding = 4;
    const textBackgroundWidth = textWidth + textPadding * 2;
    const textBackgroundHeight = 20;
    
    roundRect(
      ctx,
      position.x - textBackgroundWidth / 2,
      position.y - textBackgroundHeight / 2,
      textBackgroundWidth,
      textBackgroundHeight,
      4
    );

    // Then draw the text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`City ${city.id}`, position.x, position.y);
  };

  // Draw a map-like background
  const drawMapBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, isDarkMode: boolean) => {
    // Fill background
    ctx.fillStyle = isDarkMode ? "#121212" : "#F8F9FA"
    ctx.fillRect(0, 0, width, height)

    // Draw subtle grid for coordinate reference
    ctx.strokeStyle = isDarkMode ? "rgba(80, 80, 80, 0.2)" : "rgba(200, 200, 200, 0.5)"
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

  // Refine drawOptimizedEdgeLabels to ensure no duplicate labels are drawn
  const drawOptimizedEdgeLabels = (
    ctx: CanvasRenderingContext2D,
    cities: City[],
    cityPositions: Record<string, { x: number; y: number }>,
    distanceMatrix: Record<string, Record<string, number>>,
    isDarkMode: boolean,
  ) => {
    // Create a set to track already labeled edges
    const labeledEdges = new Set<string>();

    // Create a list of all edges with their midpoints
    const edges: Array<{
      city1: string;
      city2: string;
      midX: number;
      midY: number;
      controlX: number;
      controlY: number;
      distance: number;
      length: number;
      index: number;
    }> = [];

    let edgeIndex = 0;
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const city1 = cities[i];
        const city2 = cities[j];

        const pos1 = cityPositions[city1.id];
        const pos2 = cityPositions[city2.id];

        const edgeKey = `${Math.min(city1.id, city2.id)}-${Math.max(city1.id, city2.id)}`;
        if (labeledEdges.has(edgeKey)) {
          continue; // Skip if this edge is already labeled
        }
        labeledEdges.add(edgeKey);

        const midX = (pos1.x + pos2.x) / 2;
        const midY = (pos1.y + pos2.y) / 2;

        // Calculate curve control point
        const distance = Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
        const curveOffset = Math.min(15, distance * 0.1);
        const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) + Math.PI / 2;
        const controlX = midX + curveOffset * Math.cos(angle);
        const controlY = midY + curveOffset * Math.sin(angle);

        edges.push({
          city1: city1.id,
          city2: city2.id,
          midX,
          midY,
          controlX,
          controlY,
          distance: distanceMatrix[city1.id][city2.id],
          length: distance,
          index: edgeIndex++,
        });
      }
    }

    // Sort edges by length (shorter edges first to prioritize their label placement)
    edges.sort((a, b) => a.length - b.length);

    // Keep track of placed labels to avoid overlaps
    const placedLabels: Array<{ x: number; y: number; radius: number }> = [];
    const nodeRadius = 25; // Radius of city nodes
    const labelRadius = 14; // Reduced for better spacing
    const minDistance = labelRadius * 2.5; // Minimum distance between labels

    // Function to check if a position overlaps with existing labels or nodes
    const checkOverlap = (x: number, y: number): boolean => {
      // Check overlap with city nodes
      for (const city of cities) {
        const pos = cityPositions[city.id];
        const dx = pos.x - x;
        const dy = pos.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nodeRadius + labelRadius) {
          return true;
        }
      }

      // Check overlap with other labels
      for (const label of placedLabels) {
        const dx = label.x - x;
        const dy = label.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          return true;
        }
      }

      return false;
    };

    // Draw each edge label
    for (const edge of edges) {
      // Find the best position for this label
      const bestPos = { x: edge.midX, y: edge.midY };

      // Draw label text
      ctx.fillStyle = isDarkMode ? "#FFFFFF" : "#333333";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${edge.distance} KM`, bestPos.x, bestPos.y);

      // Add this label to the placed labels
      placedLabels.push({ x: bestPos.x, y: bestPos.y, radius: labelRadius });
    }
  };

  return (
    <div className="relative w-full aspect-[16/9] bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
      <canvas ref={canvasRef} className="w-full h-full" />
      {isAnimating && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded-md shadow-md">
          <p className="text-sm text-purple-600 dark:text-purple-400">Building map...</p>
        </div>
      )}
      {onReload && (
        <button
          onClick={onReload}
          className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Generate new map"
          disabled={isAnimating}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${isAnimating ? "text-gray-400" : "text-purple-500"}`}
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      )}
    </div>
  )
}
