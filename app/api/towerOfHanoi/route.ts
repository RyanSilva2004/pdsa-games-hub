import { NextResponse } from 'next/server';
import { saveGameRecord } from './towerOfHanoiService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerName, moves, timeTaken, moveSequence } = body;

    if (!playerName || typeof moves !== 'number' || typeof timeTaken !== 'number' || !Array.isArray(moveSequence)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const recordId = await saveGameRecord({
      playerName,
      moves,
      timeTaken,
      moveSequence
    });

    return NextResponse.json({
      success: true,
      message: "Game saved successfully",
      recordId
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save game" },
      { status: 500 }
    );
  }
}