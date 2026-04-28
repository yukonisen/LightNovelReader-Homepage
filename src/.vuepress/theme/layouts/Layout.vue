<script setup lang="ts">
import { computed } from "vue";
import { Content, RouteLink, usePageData, useRoute, useSiteData } from "vuepress/client";
import FooterBlock from "../components/FooterBlock.vue";
import { navLinks } from "../site.js";

const route = useRoute();
const page = usePageData();
const site = useSiteData();

const isHome = computed(() => route.path === "/");
const pageTitle = computed(() => {
  if (typeof page.value.title === "string" && page.value.title) return page.value.title;

  const frontmatter = page.value.frontmatter as Record<string, unknown>;
  return typeof frontmatter.title === "string" ? frontmatter.title : "";
});

const siteTitle = computed(() => site.value.title || "LightNovelReader");

const isActive = (link: string): boolean => {
  if (link === "/") return route.path === "/";
  return route.path === link || route.path.startsWith(`${link.replace(/\/$/, "")}/`);
};
</script>

<template>
  <div class="site-root">
    <header class="site-header">
      <div class="site-shell site-header__inner">
        <RouteLink class="site-brand" to="/">
          <img src="/lnr.svg" alt="LightNovelReader" />
          <span>{{ siteTitle }}</span>
        </RouteLink>

        <nav class="site-nav" aria-label="Main navigation">
          <RouteLink
            v-for="item in navLinks"
            :key="item.link"
            :to="item.link"
            :class="['site-nav__link', { 'is-active': isActive(item.link) }]"
          >
            {{ item.text }}
          </RouteLink>
        </nav>
      </div>
    </header>

    <main class="site-main">
      <div class="site-shell">
        <article :class="['page-card', { 'page-card--home': isHome }]">
          <header v-if="!isHome && pageTitle" class="page-heading">
            <p class="page-heading__eyebrow">{{ siteTitle }}</p>
            <h1>{{ pageTitle }}</h1>
          </header>

          <div class="page-content">
            <Content />
          </div>
        </article>
      </div>
    </main>

    <FooterBlock />
  </div>
</template>
