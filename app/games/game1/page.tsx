import { PageHeader } from "@/shared/components/page-header"
// import { TicTacToe } from "@/games/game1/components/tic-tac-toe"

export default function TicTacToePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader title="Tic-Tac-Toe" description="5×5 Human vs Computer game with two AI algorithms" />

      <div className="flex justify-center mt-8">

        {/* <TicTacToe /> your components come here*/}
      </div>
    </main>
  )
}

