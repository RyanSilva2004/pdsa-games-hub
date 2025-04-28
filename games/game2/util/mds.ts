// Multidimensional Scaling (MDS) for 2D plotting
// Input: distance matrix (2D array), output: array of {x, y} positions
// Reference: https://en.wikipedia.org/wiki/Multidimensional_scaling

export function mdsClassic(distances: number[][], dimensions = 2, scalingFactor = 1.0): { x: number; y: number }[] {
  const n = distances.length;
  
  // Much more aggressive adaptive scaling - increase scaling factor as number of cities increases
  // This maximizes canvas usage by pushing cities closer to the edges
  const adaptiveScaling = scalingFactor * Math.min(3.0, 1.5 + (n - 5) * 0.3);
  
  // Step 1: Double center the distance matrix
  const M = Array.from({ length: n }, () => Array(n).fill(0));
  let rowMeans = Array(n).fill(0);
  let colMeans = Array(n).fill(0);
  let totalMean = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      rowMeans[i] += distances[i][j];
      colMeans[j] += distances[i][j];
      totalMean += distances[i][j];
    }
  }
  rowMeans = rowMeans.map((v) => v / n);
  colMeans = colMeans.map((v) => v / n);
  totalMean /= n * n;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      M[i][j] = -0.5 * (distances[i][j] - rowMeans[i] - colMeans[j] + totalMean);
    }
  }

  // Step 2: Eigen decomposition (use power iteration for top 2 eigenvectors)
  // For small n, this is fast enough
  function powerIteration(A: number[][], numVecs: number): number[][] {
    const n = A.length;
    const vecs: number[][] = [];
    let B = A.map((row) => row.slice());
    for (let k = 0; k < numVecs; k++) {
      let v = Array(n).fill(0).map(() => Math.random());
      // Normalize
      let norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
      v = v.map((x) => x / norm);
      for (let iter = 0; iter < 50; iter++) {
        // Multiply by B
        const vNew = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            vNew[i] += B[i][j] * v[j];
          }
        }
        // Normalize
        norm = Math.sqrt(vNew.reduce((sum, x) => sum + x * x, 0));
        v = vNew.map((x) => x / (norm || 1));
      }
      // Rayleigh quotient for eigenvalue
      let lambda = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          lambda += v[i] * B[i][j] * v[j];
        }
      }
      // Store eigenvector
      vecs.push(v.map((x) => x * Math.sqrt(Math.max(lambda, 0)) * adaptiveScaling));
      // Deflate
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          B[i][j] -= lambda * v[i] * v[j];
        }
      }
    }
    return vecs;
  }

  const eigVecs = powerIteration(M, dimensions);
  
  // Apply even more aggressive spread for better distribution when many cities
  // This helps utilize more of the canvas space by pushing points toward the edges
  const spread = n > 6 ? Math.log(n) / Math.log(5) * 1.8 : 1.4;
  
  // Transpose to get coordinates
  const coords: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    coords.push({
      x: eigVecs[0] ? eigVecs[0][i] * spread : 0,
      y: eigVecs[1] ? eigVecs[1][i] * spread : 0,
    });
  }
  return coords;
}
