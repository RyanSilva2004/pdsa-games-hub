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
  SETUP = "setup", 
  MAP_VISUALIZATION = "map_visualization", 
  CITY_SELECTION = "city_selection",
  ROUTE_PLANNING = "route_planning", 
  COMPLETED = "completed", 
}
