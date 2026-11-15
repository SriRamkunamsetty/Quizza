import { describe, it, expect } from "vitest";
import {
  audioContentType,
  extensionForContentType,
  imageContentType,
  isSameUploadOrigin,
  mediaContentType,
} from "./upload-format";
import { isMediaUrl, mediaKind } from "./media";

describe("image and audio uploads", () => {
  it("checks the browser-visible host and safely rejects invalid origins", () => {
    expect(isSameUploadOrigin("http://127.0.0.1:3001", "127.0.0.1:3001")).toBe(
      true,
    );
    expect(
      isSameUploadOrigin("https://quiz.example.com", "quiz.example.com"),
    ).toBe(true);
    for (const origin of [
      null,
      "null",
      "https://elsewhere.test",
      "http://[invalid",
      "ftp://quiz.example.com",
      "https://user:pass@quiz.example.com",
    ])
      expect(isSameUploadOrigin(origin, "quiz.example.com")).toBe(false);
  });
  it("recognizes only supported binary image signatures", () => {
    expect(
      imageContentType(
        Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
      ),
    ).toBe("image/png");
    expect(
      imageContentType(
        Uint8Array.from([255, 216, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      ),
    ).toBe("image/jpeg");
    expect(imageContentType(new TextEncoder().encode("RIFF0000WEBP"))).toBe(
      "image/webp",
    );
    expect(
      imageContentType(new TextEncoder().encode('<svg onload="alert(1)">')),
    ).toBeNull();
    expect(
      imageContentType(new TextEncoder().encode("<html>not an image</html>")),
    ).toBeNull();
    expect(imageContentType(new Uint8Array())).toBeNull();
  });

  it("recognizes audio binary signatures for MP3, WAV, and OGG", () => {
    // MP3 with ID3 header
    const id3 = new Uint8Array(16);
    id3.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]);
    expect(audioContentType(id3)).toBe("audio/mpeg");

    // MP3 raw frame sync
    const rawMpeg = new Uint8Array(16);
    rawMpeg.set([0xff, 0xfb, 0x90, 0x64]);
    expect(audioContentType(rawMpeg)).toBe("audio/mpeg");

    // WAV
    expect(audioContentType(new TextEncoder().encode("RIFF0000WAVEfmt "))).toBe("audio/wav");

    // OGG
    const ogg = new Uint8Array(16);
    ogg.set([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02]);
    expect(audioContentType(ogg)).toBe("audio/ogg");

    // Combined media detector
    expect(mediaContentType(id3)).toBe("audio/mpeg");
    expect(extensionForContentType("audio/mpeg")).toBe(".mp3");
    expect(extensionForContentType("audio/wav")).toBe(".wav");
    expect(extensionForContentType("image/webp")).toBe(".webp");
  });

  it("accepts only tightly scoped local asset paths", () => {
    const url = "/api/v1/uploads/12345678-1234-1234-1234-123456789abc";
    expect(isMediaUrl(url)).toBe(true);
    expect(mediaKind(url)).toBe("image");

    const audioUrl = "/api/v1/uploads/12345678-1234-1234-1234-123456789abc.mp3";
    expect(isMediaUrl(audioUrl)).toBe(true);
    expect(mediaKind(audioUrl)).toBe("audio");

    for (const bad of [
      "//evil.test/x",
      "/api/v1/uploads/../../auth",
      url + "?x=1",
      "/other.png",
      "data:image/svg+xml,<svg/>",
    ])
      expect(isMediaUrl(bad)).toBe(false);
  });
});
