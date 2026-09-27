import type { VercelRequest, VercelResponse } from "@vercel/node";

const REPO     = "dmzz-yyhyy/LightNovelReader";
const GH_API   = "https://api.github.com";
const PROXY  = "https://ghfast.top";
const NIGHTLY  = "https://nightly.link";

const GRADLE_PATH         = "app/build.gradle.kts";
const TIMEOUT_API         = 8_000;
const TIMEOUT_BEST_EFFORT = 5_000;
const TIMEOUT_HANDLER     = 25_000;
const CACHE_TTL           = 60_000;
const METADATA_TTL        = 6 * 60 * 60 * 1000;
const CACHE_LIMIT         = 128;

const webhookCacheEnabled = () => process.env.UPDATE_WEBHOOK_ENABLED === "true"
  && Boolean(process.env.GITHUB_WEBHOOK_SECRET);

type Channel = "stable" | "beta" | "unstable";

interface Artifact {
  name: string;
  download_url: string;
  original_download_url: string;
  size: number;
  content_type: string;
}

interface UpdateInfo {
  channel: Channel;
  version: string;
  version_code: number;
  artifacts: Artifact[];
  size: number;
  release_notes: string;
  date: string;
  url: string;
  commit: string;
}

interface GHRelease {
  tag_name: string;
  prerelease: boolean;
  draft: boolean;
  body: string;
  published_at: string;
  html_url: string;
  target_commitish: string;
  assets: { name: string; browser_download_url: string; size: number; content_type: string }[];
}

interface ReleaseUpdate {
  tag: string;
  info: UpdateInfo;
}

export function compareReleaseVersions(left: string, right: string): number | null {
  const parse = (version: string): number[] | null => {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)([a-z])?(?:-(pre|rc)(\d+))?$/i);
    if (!match) return null;
    const [, major, minor, patch, fix, stage, sequence] = match;
    return [
      Number(major), Number(minor), Number(patch),
      fix ? fix.toLowerCase().charCodeAt(0) - 96 : 0,
      stage ? (stage.toLowerCase() === "pre" ? 0 : 1) : 2,
      Number(sequence ?? 0),
    ];
  };
  const a = parse(left);
  const b = parse(right);
  if (!a || !b) return null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

interface GHWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  updated_at: string;
  html_url: string;
  artifacts_url: string;
}

interface GHArtifact { id: number; name: string; size_in_bytes: number; expired: boolean; }

const ghHeaders: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "LNR-Update-API",
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};

const cache = new Map<string, { data: unknown; expires: number }>();
const pending = new Map<string, Promise<unknown>>();
const upstream = new Map<string, { data: unknown; etag: string }>();
const degraded = new WeakSet<UpdateInfo>();

function remember<T>(map: Map<string, T>, key: string, value: T) {
  map.delete(key);
  map.set(key, value);
  if (map.size > CACHE_LIMIT) map.delete(map.keys().next().value!);
}

async function getOrFetchCached<T>(key: string, load: () => Promise<T>, ttl = CACHE_TTL): Promise<T> {
  const useMemoryCache = !webhookCacheEnabled();
  const hit = cache.get(key);
  if (useMemoryCache && hit && Date.now() < hit.expires) return hit.data as T;
  cache.delete(key);
  const active = pending.get(key);
  if (active) return active as Promise<T>;
  const task = load().then(data => {
    if (useMemoryCache) remember(cache, key, { data, expires: Date.now() + ttl });
    return data;
  });
  pending.set(key, task);
  try { return await task; }
  finally { pending.delete(key); }
}

async function ghJson<T>(url: string, timeout = TIMEOUT_API): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  const previous = upstream.get(url);
  try {
    const headers = previous ? { ...ghHeaders, "If-None-Match": previous.etag } : ghHeaders;
    const response = await fetch(url, { headers, signal: ac.signal });
    if (response.status === 304 && previous) return previous.data as T;
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const data: T = await response.json();
    const etag = response.headers.get("etag");
    if (etag) remember(upstream, url, { data, etag });
    else upstream.delete(url);
    return data;
  }
  finally { clearTimeout(t); }
}

const withTimeout = <T>(p: Promise<T>, ms: number, label: string) =>
  new Promise<T>((ok, fail) => {
    const t = setTimeout(() => fail(new Error(`${label}: timed out (${ms}ms)`)), ms);
    p.then(ok, fail).finally(() => clearTimeout(t));
  });

const sum = (arts: Artifact[]) => arts.reduce((s, a) => s + a.size, 0);

const parseGradle = (src: string): { versionName: string; versionCode: number } => {
  const n = src.match(/versionName\s*=\s*"([^"]+)"/);
  const c = src.match(/versionCode\s*=\s*([\d_]+)/);
  return { versionName: n?.[1] ?? "unknown", versionCode: c ? Number(c[1].replace(/_/g, "")) : 0 };
};

async function fetchVersion(ref: string, fallback?: string) {
  try {
    return await getOrFetchCached(`v:${ref}`, async () => {
      const j = await ghJson<{ content: string }>(
        `${GH_API}/repos/${REPO}/contents/${GRADLE_PATH}?ref=${encodeURIComponent(ref)}`,
        TIMEOUT_BEST_EFFORT,
      );
      const version = parseGradle(Buffer.from(j.content, "base64").toString());
      if (version.versionName === "unknown" || version.versionCode === 0) throw new Error("Invalid Gradle version");
      return version;
    }, METADATA_TTL);
  } catch {
    return { versionName: fallback ?? "unknown", versionCode: 0 };
  }
}

async function resolveTag(tag: string): Promise<string> {
  try {
    return await getOrFetchCached(`tag:${tag}`, async () => {
      const ref = await ghJson<{ object: { sha: string } }>(`${GH_API}/repos/${REPO}/git/ref/tags/${encodeURIComponent(tag)}`);
      return ref.object.sha;
    }, METADATA_TTL);
  } catch { return ""; }
}

const releaseArtifacts = (assets: GHRelease["assets"]): Artifact[] => assets
  .filter(a => !a.name.toLowerCase().includes("debug"))
  .map(a => ({
    name:                  a.name,
    download_url:          `${PROXY}/${a.browser_download_url}`,
    original_download_url: a.browser_download_url,
    size:                  a.size,
    content_type:          a.content_type,
  }));

async function ciArtifacts(run: GHWorkflowRun): Promise<Artifact[]> {
  try {
    const { artifacts } = await ghJson<{ artifacts: GHArtifact[] }>(run.artifacts_url, TIMEOUT_BEST_EFFORT);
    const live = artifacts.filter(a => !a.expired && !a.name.toLowerCase().includes("debug"));
    if (live.length === 0) return [];

    return live.map(a => {
      const nightlyUrl = `${NIGHTLY}/${REPO}/actions/artifacts/${a.id}.zip`;
      return {
        name:                  a.name,
        download_url:          nightlyUrl,
        original_download_url: nightlyUrl,
        size:                  a.size_in_bytes,
        content_type:          "application/zip",
      };
    });
  } catch { return []; }
}

async function releaseChannel(channel: "stable" | "beta", release: GHRelease): Promise<ReleaseUpdate> {
  const tag = release.tag_name;
  const [ver, sha] = await Promise.all([fetchVersion(tag, tag), resolveTag(tag)]);
  const arts = releaseArtifacts(release.assets);

  const info: UpdateInfo = {
    channel,
    version:       ver.versionName,
    version_code:  ver.versionCode,
    artifacts:     arts,
    size:          sum(arts),
    release_notes: release.body ?? "",
    date:          release.published_at,
    url:           release.html_url,
    commit:        sha || release.target_commitish,
  };
  return { tag, info };
}

const getStableRelease = () => getOrFetchCached("ch:stable", async () => {
  const release = await ghJson<GHRelease>(`${GH_API}/repos/${REPO}/releases/latest`);
  return releaseChannel("stable", release);
});

const getStable = async () => (await getStableRelease()).info;

const getPrerelease = () => getOrFetchCached("ch:beta", async (): Promise<GHRelease | null> => {
  const all = await ghJson<GHRelease[]>(`${GH_API}/repos/${REPO}/releases?per_page=30`);
  return all.find(x => x.prerelease && !x.draft) ?? null;
});

const getBeta = async (): Promise<UpdateInfo> => {
  const [stableResult, betaResult] = await Promise.allSettled([getStableRelease(), getPrerelease()]);
  const stable = stableResult.status === "fulfilled" ? stableResult.value : null;
  const beta = betaResult.status === "fulfilled" ? betaResult.value : null;
  if (stable && (!beta || compareReleaseVersions(stable.tag, beta.tag_name) === 1)) {
    const info: UpdateInfo = { ...stable.info, channel: "beta" };
    if (betaResult.status === "rejected") degraded.add(info);
    return info;
  }
  if (beta) {
    const { info } = await releaseChannel("beta", beta);
    if (stableResult.status === "rejected") degraded.add(info);
    return info;
  }
  if (stableResult.status === "rejected") throw stableResult.reason;
  if (betaResult.status === "rejected") throw betaResult.reason;
  throw new Error("No release found");
};

const getUnstable = () => getOrFetchCached("ch:unstable", async (): Promise<UpdateInfo> => {
  const { workflow_runs: runs = [] } = await ghJson<{ workflow_runs: GHWorkflowRun[] }>(
    `${GH_API}/repos/${REPO}/actions/workflows/marge.yml/runs?status=success&per_page=5`,
  );
  if (runs.length === 0) throw new Error("No successful CI build found");

  const top = runs.slice(0, 5);
  let run = runs[0];
  let arts = await ciArtifacts(run);
  if (arts.length === 0) {
    const older = top.slice(1);
    const batched = await Promise.all(older.map(ciArtifacts));
    const index = batched.findIndex(items => items.length > 0);
    if (index !== -1) { run = older[index]; arts = batched[index]; }
  }

  const ver = await fetchVersion(run.head_sha, `ci-${run.head_sha.slice(0, 7)}`);

  return {
    channel:       "unstable",
    version:       ver.versionName,
    version_code:  ver.versionCode,
    artifacts:     arts,
    size:          sum(arts),
    release_notes: `本构建来自分支 [${run.head_branch}]\nCommit: ${run.head_sha.slice(0, 7)}`,
    date:          run.updated_at,
    url:           run.html_url,
    commit:        run.head_sha,
  };
});

const handlers: Record<Channel, () => Promise<UpdateInfo>> = {
  stable: getStable,
  beta: getBeta,
  unstable: getUnstable,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const rawChannel = req.query.channel ?? "stable";
  const channel = typeof rawChannel === "string" ? rawChannel.toLowerCase() : "";
  if (!Object.hasOwn(handlers, channel)) {
    return res.status(400).json({ error: "Invalid channel", message: 'Channel must be one of: "stable", "beta", "unstable"' });
  }

  try {
    const data = await withTimeout(handlers[channel as Channel](), TIMEOUT_HANDLER, `/api/update?channel=${channel}`);
    const normalTTL = webhookCacheEnabled()
      ? (channel === "unstable" ? 900 : 3600)
      : (channel === "unstable" ? 300 : 900);
    const edgeTTL = degraded.has(data) || data.version_code === 0 || data.artifacts.length === 0 ? 30 : normalTTL;
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("Vercel-CDN-Cache-Control", `public, s-maxage=${edgeTTL}, stale-while-revalidate=86400`);
    res.setHeader("Vercel-Cache-Tag", `lnr-update,lnr-update-${channel}`);
    return res.status(200).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[/api/update] channel=${channel}:`, msg);
    return res.status(502).json({ error: "Failed to fetch update info", message: msg });
  }
}
