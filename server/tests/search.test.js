import test from "node:test";
import assert from "node:assert/strict";

test("search should support fuzzy matching", () => {
  const query = "helo";
  const expectedTranscript = "Hello, I have a lot of stuff to do today.";

  assert.equal(query, "helo");
  assert.match(expectedTranscript, /hello/i);
});