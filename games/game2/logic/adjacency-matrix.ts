export class AdjacencyMatrix 
{
    private matrix: Record<string, Record<string, number>> = {}
    private cityIds: string[] = []
  
    /**
     * Create a new adjacency matrix for the given city IDs
     * @param cityIds Array of city IDs (e.g., ["A", "B", "C"])
     * @param randomize Whether to generate random distances (default: true)
     */
    
    constructor(cityIds: string[], randomize = true) {
      this.cityIds = [...cityIds]
      this.initialize(randomize)
    }
  
    /**
     * Initialize the matrix with zeros or random values
     */
    private initialize(randomize: boolean): void {
      // Create empty matrix
      this.cityIds.forEach((cityId1) => {
        this.matrix[cityId1] = {}
        this.cityIds.forEach((cityId2) => {
          this.matrix[cityId1][cityId2] = 0
        })
      })
  
      // Fill with random values if requested
      if (randomize) {
        this.randomize()
      }
    }
  
    /**
     * Fill the matrix with random distance values
     * Ensures symmetry (distance A->B equals B->A)
     */
    public randomize(): void {
      for (let i = 0; i < this.cityIds.length; i++) {
        const cityId1 = this.cityIds[i]
  
        // Set diagonal to 0 (distance to self)
        this.matrix[cityId1][cityId1] = 0
  
        for (let j = i + 1; j < this.cityIds.length; j++) {
          const cityId2 = this.cityIds[j]
  
          // Generate random distance between 50 and 99
          const distance = Math.floor(Math.random() * 50) + 50
  
          // Set symmetric values
          this.matrix[cityId1][cityId2] = distance
          this.matrix[cityId2][cityId1] = distance
        }
      }
    }
  
    /**
     * Get the distance between two cities
     */
    public getDistance(fromCity: string, toCity: string): number {
      return this.matrix[fromCity][toCity]
    }
  
    /**
     * Set the distance between two cities
     * Also sets the reverse direction to maintain symmetry
     */
    public setDistance(fromCity: string, toCity: string, distance: number): void {
      this.matrix[fromCity][toCity] = distance
      this.matrix[toCity][fromCity] = distance
    }
  
    /**
     * Get all city IDs in the matrix
     */
    public getCityIds(): string[] {
      return [...this.cityIds]
    }
  
    /**
     * Get the raw matrix data
     */
    public getMatrix(): Record<string, Record<string, number>> {
      return { ...this.matrix }
    }
  
    /**
     * Calculate the total distance of a route
     * @param route Array of city IDs representing the route
     * @returns Total distance or -1 if invalid route
     */
    public calculateRouteDistance(route: string[]): number {
      if (route.length <= 1) return 0
  
      let totalDistance = 0
  
      for (let i = 0; i < route.length - 1; i++) {
        const fromCity = route[i]
        const toCity = route[i + 1]
  
        if (!this.matrix[fromCity] || !this.matrix[fromCity][toCity]) {
          return -1 // Invalid route
        }
  
        totalDistance += this.matrix[fromCity][toCity]
      }
  
      return totalDistance
    }
  }
  