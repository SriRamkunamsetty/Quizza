import { describe, expect, it } from "vitest";
import { generateQRMatrix, qrToSvgPath } from "./qr";

describe("generateQRMatrix", () => {
  it("generates a square matrix of expected size for short text", () => {
    const text = "https://quizza.club/play/428193";
    const matrix = generateQRMatrix(text);
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    expect(matrix[0].length).toBe(matrix.length);
  });

  it("places finder patterns in top-left, top-right, and bottom-left", () => {
    const matrix = generateQRMatrix("test");
    const size = matrix.length;

    // Top-left finder center (row 3, col 3) is true
    expect(matrix[3][3]).toBe(true);
    // Top-left finder corner (0,0) is true
    expect(matrix[0][0]).toBe(true);
    // Top-right finder corner (0, size-1) is true
    expect(matrix[0][size - 1]).toBe(true);
    // Bottom-left finder corner (size-1, 0) is true
    expect(matrix[size - 1][0]).toBe(true);

    // Separators around finder (e.g. (7,0), (0,7)) should be false
    expect(matrix[7][0]).toBe(false);
    expect(matrix[0][7]).toBe(false);
  });

  it("converts matrix to clean SVG path data", () => {
    const matrix = generateQRMatrix("https://quizza.club/play/123456");
    const { path, size } = qrToSvgPath(matrix);
    expect(size).toBe(matrix.length);
    expect(path.startsWith("M")).toBe(true);
    expect(path.includes("h1v1h-1z")).toBe(true);
  });
});
