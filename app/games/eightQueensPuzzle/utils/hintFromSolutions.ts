export default function getHintFromSolutions(
  userMoves: string[],
  allSolutions: string[]
): { row: number; col: number } | null {
  let bestMatch: { row: number; col: number }[] | null = null;
  let maxMatches = -1;

  if (allSolutions.length === 0) {
    return null;
  }

  for (const solutionStr of allSolutions) {
    const solutionMoves = solutionStr.split(",").map((colStr, rowIndex) => ({
      row: rowIndex,
      col: Number(colStr),
    }));

    let match = 0;
    for (let i = 0; i < userMoves.length; i++) {
      const userCol = Number(userMoves[i]);

      if (
        userCol !== -1 &&
        solutionMoves[i] &&
        solutionMoves[i].col === userCol
      ) {
        match++;
      }
    }

    if (match > maxMatches) {
      maxMatches = match;
      bestMatch = solutionMoves;
    }
  }

  if (bestMatch) {
    for (let i = 0; i < bestMatch.length; i++) {
      if (userMoves[i] === "-1") {
        return bestMatch[i];
      }
    }
  }

  return null;
}
