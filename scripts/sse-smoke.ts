import assert from "node:assert/strict";

interface Config {
  url: string;
  connections: number;
  durationMs: number;
  headerHostToken?: string;
}

function parseArgs(argv: string[]): Config {
  const config: Config = {
    url: "http://localhost:3000/api/rooms/1/events",
    connections: 5,
    durationMs: 4000,
  };

  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key.startsWith("--")) {
      positional.push(key);
      continue;
    }
    if (!value) continue;

    if (key === "--url") {
      config.url = value;
      i++;
    } else if (key === "--connections") {
      config.connections = Number.parseInt(value, 10);
      i++;
    } else if (key === "--durationMs") {
      config.durationMs = Number.parseInt(value, 10);
      i++;
    } else if (key === "--hostToken") {
      config.headerHostToken = value;
      i++;
    }
  }

  if (positional[0] && !config.url.includes(positional[0])) {
    config.url = positional[0];
  }
  if (positional[1]) {
    const parsed = Number.parseInt(positional[1], 10);
    if (Number.isInteger(parsed)) {
      config.connections = parsed;
    }
  }
  if (positional[2]) {
    const parsed = Number.parseInt(positional[2], 10);
    if (Number.isInteger(parsed)) {
      config.durationMs = parsed;
    }
  }

  return config;
}

async function openSseOnce(url: string, durationMs: number, hostToken?: string): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), durationMs);

  try {
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    };
    if (hostToken) {
      headers["x-host-token"] = hostToken;
    }

    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return { ok: false, status: res.status };
    }

    // Read at least one chunk (event or heartbeat), then close.
    await reader.read();
    await reader.cancel();
    return { ok: true, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

async function main(): Promise<void> {
  const config = parseArgs(process.argv.slice(2));
  assert.ok(config.connections > 0, "connections must be > 0");
  assert.ok(config.durationMs >= 1000, "durationMs must be >= 1000");

  const jobs: Promise<{ ok: boolean; status: number }>[] = [];
  for (let i = 0; i < config.connections; i++) {
    jobs.push(openSseOnce(config.url, config.durationMs, config.headerHostToken));
  }

  const results = await Promise.all(jobs);
  const successCount = results.filter((r) => r.ok).length;
  const failCount = results.length - successCount;
  const statuses = Array.from(new Set(results.map((r) => r.status))).sort((a, b) => a - b);

  console.log(`sse-smoke: url=${config.url}`);
  console.log(`sse-smoke: connections=${config.connections} durationMs=${config.durationMs}`);
  console.log(`sse-smoke: success=${successCount} fail=${failCount} statuses=${statuses.join(",")}`);

  if (successCount === 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("sse-smoke: unexpected error", err);
  process.exitCode = 1;
});
