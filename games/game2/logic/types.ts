export interface City {
    id: string
    name: string
  }
  
  export type Route = string[]
  
  export interface AlgorithmResult {
    algorithm: string
    route: Route
    distance: number
    executionTime: number
  }
  