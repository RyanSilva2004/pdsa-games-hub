"use client"
import { PageHeader } from "@/shared/components/page-header";
import Chessboard from "./components/Chessboard";
import NameInput from "./components/NameInput";
import { useState } from "react";

export default function KnightsTourPage() {
  const [playerName, setPlayerName] = useState<string | null>(null);

  return (
    <main className="container mx-auto px-4 py-8">
      <PageHeader
        title="Knight's Tour"
        description="Find a sequence of knight moves that visits every square on the chessboard exactly once."
      />
      <div className="mt-12 flex flex-col items-center">
        {!playerName ? (
          <NameInput onSubmit={(name) => setPlayerName(name)} />
        ) : (
          <>
            <p className="mb-4 text-lg">Playing as: {playerName}</p>
            <Chessboard />
          </>
        )}
      </div>
    </main>
  );
}