import { PageHeader } from "@/shared/components/page-header";
import Chessboard from "./components/Chessboard";

export default function KnightsTourPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader
        title="Knight's Tour"
        description="Find a sequence of knight moves that visits every square on the chessboard exactly once."
      />
      <div className="mt-12 flex flex-col items-center">
        <Chessboard />
      </div>
    </main>
  );
}