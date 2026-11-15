import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatBytesToMb, toMemoryMetric, measureProbe } from "./diagnostics-metrics.ts";
import { presenceKey, answerCounterKey, stateChannel } from "./realtime/channels.ts";

describe("Diagnostics and Performance Probes", () => {
  it("formats bytes to megabytes accurately", () => {
    assert.equal(formatBytesToMb(0), 0);
    assert.equal(formatBytesToMb(1024 * 1024), 1);
    assert.equal(formatBytesToMb(50 * 1024 * 1024), 50);
    assert.equal(formatBytesToMb(1500000), 1.43);
  });

  it("converts byte values into structured memory metrics", () => {
    const metric = toMemoryMetric(10 * 1024 * 1024);
    assert.equal(metric.bytes, 10485760);
    assert.equal(metric.megabytes, 10);
  });

  it("measures successful probe execution and records non-negative latency", async () => {
    const result = await measureProbe(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "ok";
    });
    assert.equal(typeof result.latencyMs, "number");
    assert.ok(result.latencyMs !== null && result.latencyMs >= 5);
    assert.equal(result.error, undefined);
  });

  it("safely catches probe failures and reports error details with null latency", async () => {
    const result = await measureProbe(async () => {
      throw new Error("Connection refused (ECONNREFUSED)");
    });
    assert.equal(result.latencyMs, null);
    assert.equal(result.error, "Connection refused (ECONNREFUSED)");
  });

  it("verifies Redis channel key conventions and valid UUID formatting", () => {
    const validUuid = "12345678-1234-4123-8123-123456789abc";
    const validQid = "87654321-4321-4321-8321-cba987654321";

    assert.equal(
      presenceKey(validUuid),
      `quizza:v1:session:${validUuid}:presence`,
    );
    assert.equal(
      answerCounterKey(validUuid, validQid),
      `quizza:v1:session:${validUuid}:question:${validQid}:answers`,
    );
    assert.equal(
      stateChannel(validUuid),
      `quizza:v1:session:${validUuid}:state`,
    );
  });

  it("rejects invalid UUIDs when formatting channel keys", () => {
    assert.throws(() => presenceKey("invalid-session-id"), /Invalid realtime session id/);
    assert.throws(
      () => answerCounterKey("12345678-1234-4123-8123-123456789abc", "malicious-key"),
      /Invalid realtime question id/,
    );
  });
});
