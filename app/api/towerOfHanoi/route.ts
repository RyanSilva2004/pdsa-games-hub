import { NextResponse } from 'next/server';
import { saveGameRecord } from './towerOfHanoiService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      playerName, 
      moves, 
      timeTaken, 
      moveSequence, 
      numDisks, 
      isFourPegs,
      usedAlgorithm
    } = body;

    if (!playerName || typeof moves !== 'number' || typeof timeTaken !== 'number' || 
        !Array.isArray(moveSequence) || typeof numDisks !== 'number' || 
        typeof isFourPegs !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const recordId = await saveGameRecord({
      playerName,
      moves,
      timeTaken,
      moveSequence,
      numDisks,
      isFourPegs,
      usedAlgorithm
    });

    return NextResponse.json({
      success: true,
      message: "Game record saved successfully",
      recordId
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save game record" },
      { status: 500 }
    );
  }
}