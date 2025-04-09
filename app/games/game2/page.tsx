import { PageHeader } from "@/shared/components/page-header"
import { TravelingSalesmanGame } from "@/games/game2/components/traveling-salesman-game"

export default function TravelingSalesmanPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader
        title="Traveling Salesman Problem"
        description="Find the shortest route between cities, visiting each city exactly once and returning to the starting point"
      />

      <div className="flex justify-center mt-8">
        <TravelingSalesmanGame />
      </div>
    </main>
  )
}
