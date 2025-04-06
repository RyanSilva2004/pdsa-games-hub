import { GameCard } from "@/shared/components/game-card"
import { PageHeader } from "@/shared/components/page-header"

export default function HomePage() {
  const games = [
    {
      id: "tic-tac-toe",
      title: "Tic-Tac-Toe",
      description: "5×5 Human vs Computer game with two AI algorithms",
      icon: "Grid",
      iconColor: "#8B5CF6", // Purple color for Tic-Tac-Toe icon
      status: "ready",
      developer: "Ilmee",
      path: "/games/game1",
    },
    {
      id: "traveling-salesman",
      title: "Traveling Salesman",
      description: "Find the shortest route between cities",
      icon: "MapPin",
      iconColor: "#3B82F6", // Blue color for Traveling Salesman icon
      status: "coming-soon",
      developer: "Ryan",
      path: "/games/game2",
    },
    {
      id: "tower-of-hanoi",
      title: "Tower of Hanoi",
      description: "Solve the classic disk stacking puzzle",
      icon: "BarChart3",
      iconColor: "#10B981", // Green color for Tower of Hanoi icon
      status: "coming-soon",
      developer: "Roshan",
      path: "/games/game3",
    },
    {
      id: "eight-queens",
      title: "Eight Queens Puzzle",
      description: "Place 8 queens on a chessboard without threats",
      icon: "Puzzle",
      iconColor: "#F59E0B", // Amber color for Eight Queens icon
      status: "coming-soon",
      developer: "Dilshan",
      path: "/games/game4",
    },
    {
      id: "knights-tour",
      title: "Knight's Tour",
      description: "Find a sequence of knight moves that visits every square",
      icon: "Castle",
      iconColor: "#EC4899", // Pink color for Knight's Tour icon
      status: "coming-soon",
      developer: "Keshana",
      path: "/games/game4",
    },
  ]

  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader
        title="PDSA Games Hub"
        description="A collection of games implementing various algorithms and data structures"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </main>
  )
}

