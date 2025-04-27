export class AdjacencyMatrix 
{
    private matrix: Record<string, Record<string, number>> = {}
    private cityIds: string[] = []
  
    constructor(cityIds: string[], randomize = true) {
      this.cityIds = [...cityIds]
      this.initialize(randomize)
    }
  
    private initialize(randomize: boolean): void {
      // Create empty matrix
      this.cityIds.forEach((cityId1) => {
        this.matrix[cityId1] = {}
        this.cityIds.forEach((cityId2) => {
          this.matrix[cityId1][cityId2] = 0
        })
      })

      if (randomize) {
        this.randomize()
      }
    }
  
    // Generate random distances between cities
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
  

    public getDistance(fromCity: string, toCity: string): number {
      return this.matrix[fromCity][toCity]
    }

    // Set the distance between two cities & ensure symmetry
    public setDistance(fromCity: string, toCity: string, distance: number): void {
      this.matrix[fromCity][toCity] = distance
      this.matrix[toCity][fromCity] = distance
    }
  
    public getCityIds(): string[] {
      return [...this.cityIds]
    }

    public getMatrix(): Record<string, Record<string, number>> {
      return { ...this.matrix }
    }
  
    
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
  