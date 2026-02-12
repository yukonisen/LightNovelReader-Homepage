<template>
  <div class="download-cards">
    <div class="download-card is-featured">
      <h3>稳定版（推荐）</h3>
      <p v-if="loading">加载中……</p>
      <template v-else>
        <p v-if="stable.error">{{ stable.error }}</p>
        <template v-else-if="stable.asset">
          <p class="download-meta">发布于 {{ stable.publishedAt }}</p>
          <p>{{ stable.tag }} · {{ stable.asset.sizeMB }} MiB</p>
          <p class="download-name">{{ stable.asset.name }}</p>
          <div class="download-actions">
            <span class="download-action">
              <a class="download-btn" :href="stable.asset.url" target="_blank" rel="noopener">
                直接下载
              </a>
              <span class="qr-pop">
                <img :src="qrUrl(stable.asset.url)" alt="下载二维码" />
                <span>手机扫码下载</span>
              </span>
            </span>
            <span class="download-action">
              <a class="download-btn is-secondary" :href="stable.releaseUrl" target="_blank" rel="noopener">
                从 GitHub 下载
              </a>
              <span class="qr-pop">
                <img :src="qrUrl(stable.releaseUrl)" alt="Release 二维码" />
                <span>手机扫码访问</span>
              </span>
            </span>
          </div>
        </template>
        <p v-else>暂无可用稳定版。</p>
      </template>
    </div>

    <div class="download-card">
      <h3>Beta 测试版</h3>
      <p v-if="loading">加载中……</p>
      <template v-else>
        <p v-if="beta.error">{{ beta.error }}</p>
        <template v-else-if="beta.asset">
          <p class="download-meta">发布于 {{ beta.publishedAt }}</p>
          <p>{{ beta.tag }} · {{ beta.asset.sizeMB }} MiB</p>
          <p class="download-name">{{ beta.asset.name }}</p>
          <div class="download-actions">
            <span class="download-action">
              <a class="download-btn" :href="beta.asset.url" target="_blank" rel="noopener">
                直接下载
              </a>
              <span class="qr-pop">
                <img :src="qrUrl(beta.asset.url)" alt="下载二维码" />
                <span>手机扫码下载</span>
              </span>
            </span>
            <span class="download-action">
              <a class="download-btn is-secondary" :href="beta.releaseUrl" target="_blank" rel="noopener">
                从 GitHub 下载
              </a>
              <span class="qr-pop">
                <img :src="qrUrl(beta.releaseUrl)" alt="Release 二维码" />
                <span>手机扫码访问</span>
              </span>
            </span>
          </div>
        </template>
        <p v-else>暂无可用 Beta 版。</p>
      </template>
    </div>

    <div class="download-card">
      <h3>内部测试版</h3>
      <p v-if="loading">加载中……</p>
      <template v-else>
        <p v-if="ci.error">{{ ci.error }}</p>
        <template v-else>
          <p class="download-meta">最近成功构建: {{ ci.updatedAt }}</p>
          <p>在 <code>refactoring</code> 分支上的最新构建。</p>
          <a class="download-btn" :href="actionsUrl" target="_blank" rel="noopener">
            前往 Actions
          </a>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const owner = "dmzz-yyhyy";
const repo = "LightNovelReader";
const apiBases = [
  // Preferred: proxy GitHub API via ghproxy, then add CORS support
  "https://cors.isomorphic-git.org/https://ghproxy.com/https://api.github.com",
  // Fallback: direct GitHub API (CORS supported by GitHub)
  "https://api.github.com",
  // Fallback: CORS proxy for direct GitHub API
  "https://cors.isomorphic-git.org/https://api.github.com",
];
const actionsUrl = `https://github.com/${owner}/${repo}/actions?query=branch%3Arefactoring+is%3Asuccess`;

const loading = ref(true);
const stable = ref({
  asset: null,
  tag: "",
  publishedAt: "",
  releaseUrl: "",
  error: "",
});
const beta = ref({
  asset: null,
  tag: "",
  publishedAt: "",
  releaseUrl: "",
  error: "",
});
const ci = ref({ updatedAt: "", error: "" });

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", { hour12: false });
};

const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(2);

const qrUrl = (url) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    url
  )}`;


const pickAsset = (release) => {
  if (!release?.assets?.length) return null;
  const apk = release.assets.find((a) => a.name?.toLowerCase().endsWith(".apk"));
  const asset = apk || release.assets[0];
  return {
    name: asset.name,
    sizeMB: toMB(asset.size || 0),
    url: `https://ghproxy.com/${asset.browser_download_url}`,
  };
};

const pickLatest = (releases, { prerelease }) =>
  releases.find((r) => r.prerelease === prerelease && !r.draft);

const fetchJson = async (path) => {
  let lastError = "";
  for (const base of apiBases) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`.trim());
      return await res.json();
    } catch (err) {
      lastError = err?.message || "请求失败";
    }
  }
  throw new Error(lastError || "请求失败");
};

onMounted(async () => {
  try {
    const releases = await fetchJson(
      `/repos/${owner}/${repo}/releases?per_page=20`
    );

    const stableRelease = pickLatest(releases, { prerelease: false });
    if (stableRelease) {
      const stableAsset = pickAsset(stableRelease);
      stable.value = {
        asset: stableAsset,
        tag: stableRelease.tag_name || "",
        publishedAt: formatDate(stableRelease.published_at),
        releaseUrl: stableRelease.html_url || "",
        error: "",
      };
    }

    const betaRelease = pickLatest(releases, { prerelease: true });
    if (betaRelease) {
      const betaAsset = pickAsset(betaRelease);
      beta.value = {
        asset: betaAsset,
        tag: betaRelease.tag_name || "",
        publishedAt: formatDate(betaRelease.published_at),
        releaseUrl: betaRelease.html_url || "",
        error: "",
      };
    }
  } catch (err) {
    const message = err?.message || "Release 信息获取失败";
    stable.value.error = message;
    beta.value.error = message;
  }

  try {
    const data = await fetchJson(
      `/repos/${owner}/${repo}/actions/runs?branch=refactoring&status=success&per_page=1`
    );
    const run = data.workflow_runs?.[0];
    if (run) {
      ci.value.updatedAt = formatDate(run.updated_at || run.created_at);
    }
  } catch (err) {
    ci.value.error = err?.message || "Actions 信息获取失败";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.download-cards {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.download-card {
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--vp-c-bg-elv);
}

.download-card.is-featured {
  border-color: #1f9d55;
  background: linear-gradient(135deg, #e6f7ee 0%, #c9f0dc 100%);
}

.download-card h3 {
  margin: 0 0 8px;
}

.download-meta {
  margin: 0 0 4px;
  font-size: 0.85rem;
  color: var(--vp-c-text-mute);
}

.download-name {
  margin: 6px 0 2px;
}

.download-hash {
  margin: 0 0 6px;
  font-size: 0.75rem;
  color: var(--vp-c-text-mute);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

.download-btn {
  display: inline-block;
  margin-top: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  background: #1f3fb3;
  color: #fff;
  text-decoration: none;
}

.download-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.download-action {
  position: relative;
  display: inline-flex;
}

.qr-pop {
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  transform: translateX(-50%);
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  padding: 10px;
  width: 160px;
  box-sizing: border-box;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  display: none;
  align-items: center;
  gap: 6px;
  z-index: 10;
  text-align: center;
  font-size: 0.75rem;
  color: var(--vp-c-text-mute);
}

.qr-pop img {
  width: 140px;
  height: 140px;
  display: block;
}

@media (hover: hover) and (pointer: fine) {
  .download-action:hover .qr-pop {
    display: flex;
    flex-direction: column;
  }
}

.download-btn.is-secondary {
  background: transparent;
  border: 1px solid currentColor;
  color: #1f3fb3;
}

.download-btn.is-secondary:hover {
  background: rgba(31, 63, 179, 0.1);
}

.download-btn:hover {
  background: #17308d;
}
</style>
