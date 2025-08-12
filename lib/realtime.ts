import { Redis } from "@upstash/redis";

type Listener<T = unknown> = (payload: T) => void;

// Memory fallback for local/dev and single-process deployments
const memoryChannels = new Map<string, Set<Listener>>();

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient !== null) return redisClient;
  try {
    // Works in Node and Edge if env vars are present
    const client = (Redis as any).fromEnv
      ? (Redis as any).fromEnv()
      : new Redis({
          url: (process as any)?.env?.UPSTASH_REDIS_REST_URL,
          token: (process as any)?.env?.UPSTASH_REDIS_REST_TOKEN,
        });
    // Basic sanity check
    if (!client) return (redisClient = null);
    redisClient = client as Redis;
  } catch {
    redisClient = null;
  }
  return redisClient;
}

function streamKey(channel: string) {
  return `sse:${channel}`;
}

// Subscribe to a channel. Uses Upstash Broadcast when configured, else in-memory.
export function subscribe<T = unknown>(channel: string, cb: Listener<T>) {
  const redis = getRedis();
  if (redis) {
    let stopped = false;
    let lastId = "0-0";
    let timer: number | null = null;
    let initialized = false;

    const init = async () => {
      if (initialized) return;
      initialized = true;
      try {
        const res: any = await (redis as any).xrevrange(
          streamKey(channel),
          "+",
          "-",
          1
        );
        // Upstash may return object keyed by ID or an array
        if (res) {
          if (Array.isArray(res) && res.length > 0) {
            lastId = String(res[0][0] ?? "0-0");
          } else if (typeof res === "object") {
            const ids = Object.keys(res);
            if (ids.length > 0) lastId = ids[0];
          }
        }
      } catch {
        lastId = "0-0";
      }
    };

    const loop = async () => {
      if (stopped) return;
      try {
        // Fetch messages newer than lastId
        const res: any = await (redis as any).xrange(
          streamKey(channel),
          `(${lastId}`,
          "+",
          100
        );
        if (res) {
          if (Array.isArray(res)) {
            for (const entry of res as any[]) {
              const id = String(entry?.[0] ?? lastId);
              const fields = entry?.[1] as Record<string, string> | undefined;
              lastId = id;
              const raw = fields?.d;
              if (!raw) continue;
              try {
                const payload = JSON.parse(raw) as T;
                cb(payload);
              } catch {}
            }
          } else if (typeof res === "object") {
            // Object keyed by id
            for (const id of Object.keys(res)) {
              const fields = res[id] as Record<string, string> | undefined;
              lastId = id;
              const raw = fields?.d as string | undefined;
              if (!raw) continue;
              try {
                const payload = JSON.parse(raw) as T;
                cb(payload);
              } catch {}
            }
          }
        }
      } catch (e) {
        // transient errors; continue
      } finally {
        timer = setTimeout(loop, 1000) as unknown as number;
      }
    };

    // Kick off init then polling loop
    init().finally(() => loop());
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }

  // Memory fallback
  let set = memoryChannels.get(channel);
  if (!set) {
    set = new Set();
    memoryChannels.set(channel, set);
  }
  set.add(cb as Listener);
  return () => {
    set?.delete(cb as Listener);
  };
}

// Publish a payload on a channel. Uses Upstash Broadcast when configured, else in-memory.
export async function publish<T = unknown>(channel: string, payload: T) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.xadd(streamKey(channel), "*", { d: JSON.stringify(payload) });
      return;
    } catch (e) {
      console.error("redis publish error", e);
    }
  }
  // Memory fallback
  const set = memoryChannels.get(channel);
  if (!set) return;
  set.forEach((cb) => {
    try {
      (cb as Listener<T>)(payload);
    } catch (e) {
      console.error("publish error", e);
    }
  });
}
