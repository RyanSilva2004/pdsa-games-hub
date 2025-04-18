export const isValidKnightMove = (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ): boolean => {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  };