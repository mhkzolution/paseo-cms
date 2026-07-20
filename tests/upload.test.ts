import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getUploadKind, isFileSizeValid, MAX_FILE_SIZE_BYTES } from "@/lib/upload";

describe("upload helpers", () => {
  it("detects supported MIME types", () => {
    assert.equal(getUploadKind("image/webp"), "image");
    assert.equal(getUploadKind("application/pdf"), "pdf");
    assert.equal(getUploadKind("video/mp4"), "video");
  });

  it("rejects unsupported MIME types", () => {
    assert.equal(getUploadKind("text/html"), null);
  });

  it("validates file size limits by upload kind", () => {
    assert.equal(isFileSizeValid("image", MAX_FILE_SIZE_BYTES.image), true);
    assert.equal(isFileSizeValid("image", MAX_FILE_SIZE_BYTES.image + 1), false);
    assert.equal(isFileSizeValid("video", MAX_FILE_SIZE_BYTES.video - 1), true);
  });
});
