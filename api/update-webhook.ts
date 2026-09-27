import { createHmac, timingSafeEqual } from "node:crypto";
import { invalidateByTag } from "@vercel/functions";

const REPO = "dmzz-yyhyy/LightNovelReader";
const MAX_BODY_BYTES = 1024 * 1024;
const RELEASE_ACTIONS = new Set([
  "published", "unpublished", "created", "edited", "deleted", "prereleased", "released",
]);

interface Payload {
  action?: string;
  repository?: { full_name?: string };
  release?: { draft?: boolean };
  workflow_run?: { path?: string; conclusion?: string };
}

const reply = (status: number, body: unknown) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store" },
});

export function createWebhookHandler(invalidate: (tags: string[]) => Promise<unknown>) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") return reply(405, { error: "Method not allowed" });
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) return reply(503, { error: "Webhook secret is not configured" });

    const signature = request.headers.get("x-hub-signature-256") ?? "";
    if (!/^sha256=[0-9a-f]{64}$/i.test(signature)) return reply(401, { error: "Invalid signature" });

    const chunks: Uint8Array[] = [];
    let size = 0;
    if (!request.body) return reply(400, { error: "Missing payload" });
    const reader = request.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY_BYTES) {
          await reader.cancel();
          return reply(413, { error: "Payload too large" });
        }
        chunks.push(value);
      }
    } catch {
      return reply(400, { error: "Unable to read payload" });
    } finally { reader.releaseLock(); }
    const raw = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength; }
    const expected = new Uint8Array(createHmac("sha256", secret).update(raw).digest());
    if (!timingSafeEqual(expected, new Uint8Array(Buffer.from(signature.slice(7), "hex")))) {
      return reply(401, { error: "Invalid signature" });
    }

    let payload: Payload;
    try {
      payload = JSON.parse(new TextDecoder().decode(raw));
      if (!payload || typeof payload !== "object") throw new Error("Invalid payload");
    } catch { return reply(400, { error: "Invalid JSON payload" }); }
    if (payload.repository?.full_name !== REPO) return reply(403, { error: "Unexpected repository" });

    const event = request.headers.get("x-github-event");
    if (event === "ping") return reply(200, { ok: true, event: "ping" });
    let tags: string[];
    if (event === "release" && RELEASE_ACTIONS.has(payload.action ?? "") && !payload.release?.draft) {
      tags = ["lnr-update-stable", "lnr-update-beta"];
    } else if (event === "workflow_run" && payload.action === "completed"
      && payload.workflow_run?.conclusion === "success"
      && payload.workflow_run.path === ".github/workflows/marge.yml") {
      tags = ["lnr-update-unstable"];
    } else {
      return reply(200, { ok: true, ignored: true });
    }

    try {
      await invalidate(tags);
      return reply(200, { ok: true, invalidated: tags });
    } catch (error) {
      console.error("[/api/update-webhook] Cache invalidation failed:", error instanceof Error ? error.message : "Unknown error");
      return reply(502, { error: "Cache invalidation failed; redeliver this event" });
    }
  };
}

export default {
  fetch: createWebhookHandler(async tags => {
    if (process.env.VERCEL !== "1" || !["production", "preview"].includes(process.env.VERCEL_ENV ?? "")) {
      throw new Error("CDN invalidation requires a deployed Vercel function");
    }
    await invalidateByTag(tags);
  }),
};
