export interface City {
  id: string
  name: string
  x?: number
  y?: number
  selected?: boolean
}

export type Route = string[]

export interface GameState {
  currentRoute: string[]
  startCity: string | null
  homeCity: string | null  // Added homeCity property to track the randomly selected home city
  totalDistance: number
  isComplete: boolean
}

export enum GamePhase {
  SETUP = "setup", // Ask for name and number of cities
  MAP_VISUALIZATION = "map_visualization", // Show the map with all cities
  CITY_SELECTION = "city_selection", // Select cities to visit
  ROUTE_PLANNING = "route_planning", // Plan the route (future phase)
  COMPLETED = "completed", // Route completed (future phase)
}
