import { TicTacToe } from "@/games/ticTacToe/ui/tic-tac-toe"
import { PageHeader } from "@/shared/components/page-header"

export default function TicTacToePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader title="Tic-Tac-Toe" description="5×5 Human vs Computer game with two AI algorithms" />

      <div className="flex justify-center mt-3">

      <TicTacToe />
      </div>
    </main>
  )
}

