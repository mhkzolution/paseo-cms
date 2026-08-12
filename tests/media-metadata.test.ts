import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractMediaMetadata, extensionFromName } from "@/lib/media-metadata";

describe("extractMediaMetadata", () => {
  it("returns extension and mime for PDF without dimensions", () => {
    const buffer = Buffer.from("%PDF-1.4");
    const result = extractMediaMetadata(buffer, {
      mimeType: "application/pdf",
      originalName: "brief.pdf",
      mediaType: "PDF",
    });
    assert.equal(result.extension, "pdf");
    assert.equal(result.mimeType, "application/pdf");
    assert.equal(result.originalName, "brief.pdf");
    assert.equal(result.width, null);
    assert.equal(result.height, null);
  });

  it("reads width/height for a small PNG", () => {
    // 1x1 PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const result = extractMediaMetadata(png, {
      mimeType: "image/png",
      originalName: "dot.png",
      mediaType: "IMAGE",
    });
    assert.equal(result.width, 1);
    assert.equal(result.height, 1);
    assert.equal(result.extension, "png");
  });

  it("returns null dimensions when image probe fails", () => {
    const result = extractMediaMetadata(Buffer.from("not-an-image"), {
      mimeType: "image/jpeg",
      originalName: "bad.jpg",
      mediaType: "IMAGE",
    });
    assert.equal(result.width, null);
    assert.equal(result.height, null);
  });
});

describe("extensionFromName", () => {
  it("strips dot and lowercases", () => {
    assert.equal(extensionFromName("Logo.PNG"), "png");
    assert.equal(extensionFromName("file"), null);
  });
});
