export type MemoryMetric = {
  bytes: number;
  megabytes: number;
};

export type ServiceProbe = {
  status: "ok" | "error" | "disabled";
  latencyMs: number | null;
  error?: string;
  driver?: string;
};

export type HealthDiagnostics = {
  ok: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      rss: MemoryMetric;
      heapUsed: MemoryMetric;
      heapTotal: MemoryMetric;
      external: MemoryMetric;
    };
  };
  checks: {
    postgres: ServiceProbe;
    redis: ServiceProbe;
  };
};

/** Formats bytes to megabytes rounded to two decimal places. */
export function formatBytesToMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

/** Formats a byte quantity into a MemoryMetric record. */
export function toMemoryMetric(bytes: number): MemoryMetric {
  return {
    bytes,
    megabytes: formatBytesToMb(bytes),
  };
}

/**
 * Measures the execution duration of an asynchronous probe in milliseconds.
 */
export async function measureProbe(
  probeFn: () => Promise<unknown>,
): Promise<{ latencyMs: number | null; error?: string }> {
  const start = performance.now();
  try {
    await probeFn();
    const duration = Math.round((performance.now() - start) * 100) / 100;
    return { latencyMs: duration };
  } catch (err) {
    return {
      latencyMs: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
