<template>
  <section class="changelog-page">
    <div class="changelog-tabs" role="tablist" aria-label="更新日志分类">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="changelog-tab"
        :class="{ 'is-active': activeTab === tab.id }"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeEntries.length" class="changelog-list">
      <details
        v-for="entry in activeEntries"
        :key="`${entry.version}-${entry.date}`"
        class="changelog-entry"
      >
        <summary class="changelog-summary">
          <span class="changelog-title">
            <span v-if="entry.title" class="changelog-name">{{ entry.title }}</span>
            <span class="changelog-version">{{ entry.version }}</span>
          </span>
          <span class="changelog-meta">
            <span
              v-if="entry.contributors.length"
              class="changelog-contributors"
              aria-label="贡献者"
            >
              <a
                v-for="contributor in entry.contributors"
                :key="contributor"
                class="changelog-contributor"
                :href="`https://github.com/${contributor}`"
                :title="`@${contributor}`"
                target="_blank"
                rel="noopener"
                @click.stop
              >
                <img
                  :src="`https://github.com/${contributor}.png?size=40`"
                  :alt="`@${contributor}`"
                  loading="lazy"
                />
              </a>
            </span>
            <time class="changelog-date" :datetime="entry.date">{{ entry.date }}</time>
          </span>
        </summary>

        <div class="changelog-body">
          <p v-if="entry.summary" class="changelog-summary-text">
            {{ entry.summary }}
          </p>

          <p v-if="entry.warning" class="changelog-warning">
            {{ entry.warning }}
          </p>

          <section
            v-for="section in entry.sections"
            :key="section.title"
            class="changelog-section"
          >
            <h3>{{ section.title }}</h3>
            <ul>
              <li v-for="(item, index) in section.items" :key="index">
                {{ item }}
              </li>
            </ul>
          </section>

          <div v-if="entry.links.length" class="changelog-links">
            <a
              v-for="link in entry.links"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener"
            >
              {{ link.label }}
            </a>
          </div>
        </div>
      </details>
    </div>

    <p v-else class="changelog-empty">暂无更新日志。</p>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";

const categoryModules = {
  lnr: import.meta.glob("./data/light-novel-reader/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
  api: import.meta.glob("./data/api/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
};

const tabs = [
  { id: "lnr", label: "LightNovelReader" },
  { id: "api", label: "API" },
];

const activeTab = ref(tabs[0].id);

const sectionTitleMap = {
  Added: "新增",
  Changed: "变更",
    Deprecated: "即将废弃",
  Removed: "移除",
  Fixed: "修复",
  Security: "安全",
  新增: "新增",
  变更: "变更",
  即将废弃: "即将废弃",
  移除: "移除",
  修复: "修复",
  安全: "安全",
};

const stripFrontmatter = (content) => {
  if (!content.startsWith("---")) return { data: {}, body: content };

  const closeIndex = content.indexOf("\n---", 3);
  if (closeIndex === -1) return { data: {}, body: content };

  const rawFrontmatter = content.slice(3, closeIndex).trim();
  const body = content.slice(closeIndex + 4).trim();
  const data = {};
  let activeKey = "";
  let activeObject = null;

  rawFrontmatter.split("\n").forEach((line) => {
    const keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyValue) {
      activeKey = keyValue[1];
      activeObject = null;
      const value = keyValue[2].trim();
      data[activeKey] = value ? value.replace(/^["']|["']$/g, "") : [];
      return;
    }

    const listObjectItem = line.match(/^\s*-\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (listObjectItem && activeKey) {
      if (!Array.isArray(data[activeKey])) data[activeKey] = [];
      activeObject = {
        [listObjectItem[1]]: listObjectItem[2].trim().replace(/^["']|["']$/g, ""),
      };
      data[activeKey].push(activeObject);
      return;
    }

    const objectField = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (objectField && activeObject) {
      activeObject[objectField[1]] = objectField[2].trim().replace(/^["']|["']$/g, "");
      return;
    }

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && activeKey) {
      if (!Array.isArray(data[activeKey])) data[activeKey] = [];
      data[activeKey].push(listItem[1].trim().replace(/^["']|["']$/g, ""));
      activeObject = null;
    }
  });

  return { data, body };
};

const parseLinks = (lines) =>
  lines
    .map((line) => line.match(/^\[([^\]]+)]:\s*(\S+)/))
    .filter(Boolean)
    .map((match) => ({ label: match[1], url: match[2] }));

const parseEntry = (content, path) => {
  const { data, body } = stripFrontmatter(content);
  const lines = body.split("\n");
  const heading = lines
    .map((line) => line.match(/^##\s+\[?([^\]\s]+)]?\s*-\s*(\d{4}-\d{2}-\d{2})/))
    .find(Boolean);

  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch) {
      const title = sectionTitleMap[sectionMatch[1].trim()];
      currentSection = title ? { title, items: [] } : null;
      if (currentSection) sections.push(currentSection);
      return;
    }

    const listItem = line.match(/^-\s+(.+)$/);
    if (listItem && currentSection) {
      currentSection.items.push(listItem[1].trim());
    }
  });

  const fallbackVersion = path.split("/").pop()?.replace(/\.md$/, "") || "";

  return {
    title: data.title || "",
    version: data.version || heading?.[1] || fallbackVersion,
    date: data.date || heading?.[2] || "",
    summary: data.summary || "",
    warning: data.warning || "",
    contributors: Array.isArray(data.contributors) ? data.contributors : [],
    sections: sections.filter((section) => section.items.length),
    links: [
      ...parseLinks(lines),
      ...(Array.isArray(data.links)
        ? data.links.map((link) =>
            typeof link === "string"
              ? { label: link, url: link }
              : { label: link.label || link.url, url: link.url }
          )
        : []),
    ].filter((link) => link.url),
  };
};

const entriesByTab = Object.fromEntries(
  Object.entries(categoryModules).map(([category, modules]) => [
    category,
    Object.entries(modules)
      .map(([path, content]) => parseEntry(String(content), path))
      .sort((a, b) => b.date.localeCompare(a.date) || b.version.localeCompare(a.version)),
  ])
);

const activeEntries = computed(() => entriesByTab[activeTab.value] || []);
</script>

<style scoped>
.changelog-page {
  max-width: 920px;
  margin: 0 auto;
}

.changelog-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin: 0 0 20px;
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
}

.changelog-tab {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-left: 1px solid var(--vp-c-border);
  border-radius: 0;
  background: transparent;
  color: var(--vp-c-text-mute);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.changelog-tab:first-child {
  border-left: 0;
  border-radius: 9px 0 0 9px;
}

.changelog-tab:last-child {
  border-radius: 0 9px 9px 0;
}

.changelog-tab:hover {
  color: var(--vp-c-text);
  background: var(--vp-c-control-hover);
}

.changelog-tab.is-active {
  color: var(--vp-c-accent);
  background: var(--vp-c-accent-soft);
  box-shadow: inset 0 0 0 1px var(--vp-c-accent-bg);
}

.changelog-list {
  display: grid;
  gap: 12px;
}

.changelog-entry {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
  overflow: hidden;
}

.changelog-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  cursor: pointer;
}

.changelog-summary::marker {
  color: var(--vp-c-text-mute);
}

.changelog-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.changelog-version {
  font-weight: 700;
  color: var(--vp-c-text-mute);
}

.changelog-date {
  color: var(--vp-c-text-mute);
}

.changelog-name {
  font-weight: 800;
  color: var(--vp-c-text);
}

.changelog-date {
  flex: 0 0 auto;
  font-size: 0.9rem;
}

.changelog-meta {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
}

.changelog-contributors {
  display: inline-flex;
  flex-direction: row-reverse;
  align-items: center;
  padding-left: 8px;
}

.changelog-contributor {
  display: inline-flex;
  width: 24px;
  height: 24px;
  margin-left: -8px;
  border: 2px solid var(--vp-c-bg-elv);
  border-radius: 50%;
  background: var(--vp-c-bg-elv);
  overflow: hidden;
  transition: transform 0.16s ease;
}

.changelog-contributor:hover {
  transform: translateY(-1px);
  z-index: 1;
}

.changelog-contributor img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.changelog-body {
  padding: 0 18px 18px;
  border-top: 1px solid var(--vp-c-divider);
}

.changelog-summary-text {
  margin: 16px 0 0;
  line-height: 1.75;
  color: var(--vp-c-text);
}

.changelog-warning {
  margin: 14px 0 0;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, #d97706 40%, var(--vp-c-border));
  border-radius: 8px;
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  color: var(--vp-c-text);
}

.changelog-section h3 {
  margin: 18px 0 8px;
  font-size: 1rem;
}

.changelog-section ul {
  margin: 0;
  padding-left: 1.25rem;
}

.changelog-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.changelog-links a {
  padding: 6px 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 7px;
  text-decoration: none;
  background: var(--vp-c-bg-alt);
}

.changelog-empty {
  color: var(--vp-c-text-mute);
}

@media (max-width: 600px) {
  .changelog-tabs {
    display: flex;
    width: 100%;
    box-sizing: border-box;
  }

  .changelog-tab {
    flex: 1;
    padding: 0 10px;
  }

  .changelog-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .changelog-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
