import { NextResponse } from 'next/server';
import { saveGameRecord } from './towerOfHanoiService';  // Import your service

export async function POST(request: Request) {
  try {
    // Log to check if the request is reaching the API
    console.log("Received request at saveGame endpoint");

    const body = await request.json();
    const { playerName, moves, timeTaken } = body;

    // Validate the incoming data
    if (!playerName || typeof moves !== 'number' || typeof timeTaken !== 'number') {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Call the saveGameRecord service function to save data
    const recordId = await saveGameRecord({
      playerName,
      moves,
      timeTaken
    });

    // Send success response
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
