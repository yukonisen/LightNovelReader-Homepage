import type { VercelRequest, VercelResponse } from "@vercel/node";

const REPO     = "dmzz-yyhyy/LightNovelReader";
const GH_API   = "https://api.github.com";
const PROXY  = "https://ghfast.top";
const NIGHTLY  = "https://nightly.link";

const GRADLE_PATH         = "app/build.gradle.kts";
const TIMEOUT_API         = 8_000;
const TIMEOUT_BEST_EFFORT = 5_000;
const TIMEOUT_HANDLER     = 25_000;
const CACHE_TTL           = 5 * 60 * 1000;

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

const cache = new Map<string, { data: unknown; ts: number }>();
const cached = <T>(k: string): T | undefined => {
  const e = cache.get(k);
  if (e && Date.now() - e.ts < CACHE_TTL) return e.data as T;
  cache.delete(k);
};
const store = <T>(k: string, v: T): T => (cache.set(k, { data: v, ts: Date.now() }), v);

async function ghFetch(url: string, timeout = TIMEOUT_API): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeout);
  try { return await fetch(url, { headers: ghHeaders, signal: ac.signal }); }
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
  const key = `v:${ref}`;
  const hit = cached<{ versionName: string; versionCode: number }>(key);
  if (hit) return hit;

  try {
    const r = await ghFetch(
      `${GH_API}/repos/${REPO}/contents/${GRADLE_PATH}?ref=${encodeURIComponent(ref)}`,
      TIMEOUT_BEST_EFFORT,
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    return store(key, parseGradle(Buffer.from(j.content, "base64").toString()));
  } catch {
    return { versionName: fallback ?? "unknown", versionCode: 0 };
  }
}

async function resolveTag(tag: string): Promise<string> {
  try {
    const r = await ghFetch(`${GH_API}/repos/${REPO}/git/ref/tags/${tag}`);
    if (!r.ok) return "";
    return ((await r.json()) as { object: { sha: string } }).object.sha;
  } catch { return ""; }
}

const releaseArtifacts = (assets: GHRelease["assets"]): Artifact[] => assets
  .filter(a => !a.name.includes("debug"))
  .map(a => ({
    name:                  a.name,
    download_url:          `${PROXY}/${a.browser_download_url}`,
    original_download_url: a.browser_download_url,
    size:                  a.size,
    content_type:          a.content_type,
  }));

async function ciArtifacts(run: GHWorkflowRun): Promise<Artifact[]> {
  try {
    const r = await ghFetch(run.artifacts_url, TIMEOUT_BEST_EFFORT);
    if (!r.ok) return [];
    const { artifacts }: { artifacts: GHArtifact[] } = await r.json();
    const live = artifacts.filter(a => !a.expired);
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

async function releaseChannel(channel: "stable" | "beta", fetchRelease: () => Promise<GHRelease>): Promise<UpdateInfo> {
  const hit = cached<UpdateInfo>(`ch:${channel}`);
  if (hit) return hit;

  const release = await fetchRelease();
  const tag = release.tag_name;
  const [ver, sha] = await Promise.all([fetchVersion(tag, tag), resolveTag(tag)]);
  const arts = releaseArtifacts(release.assets);

  return store(`ch:${channel}`, {
    channel,
    version:       ver.versionName,
    version_code:  ver.versionCode,
    artifacts:     arts,
    size:          sum(arts),
    release_notes: release.body ?? "",
    date:          release.published_at,
    url:           release.html_url,
    commit:        sha || release.target_commitish,
  });
}

const getStable = () => releaseChannel("stable", async () => {
  const r = await ghFetch(`${GH_API}/repos/${REPO}/releases/latest`);
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
});

const getBeta = () => releaseChannel("beta", async () => {
  const r = await ghFetch(`${GH_API}/repos/${REPO}/releases?per_page=30`);
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const all: GHRelease[] = await r.json();
  const pre = all.find(x => x.prerelease && !x.draft);
  if (!pre) throw new Error("No pre-release found");
  return pre;
});

const getUnstable = async (): Promise<UpdateInfo> => {
  const hit = cached<UpdateInfo>("ch:unstable");
  if (hit) return hit;

  const r = await ghFetch(`${GH_API}/repos/${REPO}/actions/runs?status=success&per_page=10`);
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const { workflow_runs: runs = [] }: { workflow_runs: GHWorkflowRun[] } = await r.json();
  if (runs.length === 0) throw new Error("No successful CI build found");

  const top = runs.slice(0, 5);
  const batched = await Promise.all(top.map(ciArtifacts));

  let run = runs[0];
  let arts: Artifact[] = [];
  for (let i = 0; i < top.length; i++) {
    if (batched[i].length > 0) { run = top[i]; arts = batched[i]; break; }
  }

  const ver = await fetchVersion(run.head_sha, `ci-${run.head_sha.slice(0, 7)}`);

  return store("ch:unstable", {
    channel:       "unstable",
    version:       ver.versionName,
    version_code:  ver.versionCode,
    artifacts:     arts,
    size:          sum(arts),
    release_notes: `本构建来自分支 [${run.head_branch}]\nCommit: ${run.head_sha.slice(0, 7)}`,
    date:          run.updated_at,
    url:           run.html_url,
    commit:        run.head_sha,
  });
};

const handlers: Record<Channel, () => Promise<UpdateInfo>> = {
  stable: getStable,
  beta: getBeta,
  unstable: getUnstable,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const channel = ((req.query.channel as string) ?? "stable").toLowerCase();
  if (!(channel in handlers)) {
    return res.status(400).json({ error: "Invalid channel", message: 'Channel must be one of: "stable", "beta", "unstable"' });
  }

  try {
    const data = await withTimeout(handlers[channel as Channel](), TIMEOUT_HANDLER, `/api/update?channel=${channel}`);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[/api/update] channel=${channel}:`, msg);
    return res.status(502).json({ error: "Failed to fetch update info", message: msg });
  }
}
