import { NextResponse } from 'next/server';
import { saveAlgorithmTime } from '../towerOfHanoiService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      playerName, 
      algorithm,
      time,
      numDisks,
      isFourPegs
    } = body;

    if (!playerName || !algorithm || typeof time !== 'number' || 
        typeof numDisks !== 'number' || typeof isFourPegs !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const recordId = await saveAlgorithmTime({
      playerName,
      algorithm,
      time,
      numDisks,
      isFourPegs
    });

    return NextResponse.json({
      success: true,
      message: "Algorithm time saved successfully",
      recordId
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save algorithm time" },
      { status: 500 }
    );
  }
}