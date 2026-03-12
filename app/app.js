const ICONS = {
  briefcase: "◼",
  calendar: "◷",
  map: "⌘",
  spark: "✦",
  cloud: "☁",
  sun: "☼",
  moon: "◐",
};

const state = {
  manifest: null,
  modules: null,
  pages: new Map(),
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

async function loadText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.text();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  if (inList) {
    html.push("</ul>");
  }
  return html.join("");
}

async function loadManifest() {
  if (!state.manifest) {
    const island = await loadJson("../island/island.json");
    const primaryExpression = island.expressions[0];
    const expression = await loadJson(`../island/${primaryExpression.path.replace(/^\.\//, "")}`);
    state.manifest = { island, expression, expressionRef: primaryExpression };
  }
  return state.manifest;
}

async function loadModules() {
  if (state.modules) {
    return state.modules;
  }

  const manifest = await loadManifest();
  const expressionRoot = manifest.expressionRef.path.replace(/^\.\//, "").replace(/\/expression\.json$/, "");
  const modules = await Promise.all(
    manifest.expression.modules.map(async (slug) => {
      const basePath = `../island/${expressionRoot}/${slug}`;
      const [module, scene] = await Promise.all([
        loadJson(`${basePath}/module.json`),
        loadJson(`${basePath}/scene.json`),
      ]);
      return { ...module, scene, basePath };
    }),
  );

  state.modules = modules;
  return modules;
}

async function loadPage(module, pageSlug) {
  const key = `${module.slug}:${pageSlug}`;
  if (state.pages.has(key)) {
    return state.pages.get(key);
  }

  const page = await loadJson(`${module.basePath}/pages/${pageSlug}/page.json`);
  const blocks = await Promise.all(
    page.blocks.map(async (block) => {
      if (block.type === "richText" && block.source?.markdown) {
        return {
          ...block,
          markdown: await loadText(`${module.basePath}/${block.source.markdown}`),
        };
      }
      return block;
    }),
  );

  const resolved = { ...page, blocks };
  state.pages.set(key, resolved);
  return resolved;
}

function getSceneVars(scene) {
  const palette = scene.palette || {};
  return {
    "--page-bg": palette.background || "#ececec",
    "--page-bg-soft": palette.backgroundSoft || "#f6f6f6",
    "--panel-bg": palette.panel || "rgba(255,255,255,0.84)",
    "--text-main": palette.text || "#222",
    "--text-muted": palette.muted || "#666",
    "--hero-start": palette.heroStart || "#5485c7",
    "--hero-end": palette.heroEnd || "#3f64a9",
    "--card-start": palette.cardStart || "#6a8fd0",
    "--card-end": palette.cardEnd || "#4c70b7",
    "--cloud-color": palette.cloud || "rgba(255,255,255,0.65)",
  };
}

function applyScene(scene) {
  const app = document.querySelector("#app");
  const vars = getSceneVars(scene);
  Object.entries(vars).forEach(([key, value]) => app.style.setProperty(key, value));
}

function icon(name) {
  return ICONS[name] || "•";
}

function parseHash() {
  const hash = window.location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/").filter(Boolean);

  if (parts.length === 0) {
    return { view: "library" };
  }
  if (parts[0] === "modules" && parts[1] && parts[2] === "pages" && parts[3]) {
    return { view: "module", moduleSlug: parts[1], pageSlug: parts[3] };
  }
  if (parts[0] === "modules" && parts[1]) {
    return { view: "module", moduleSlug: parts[1], pageSlug: null };
  }
  return { view: "library" };
}

function moduleHref(moduleSlug) {
  return `#/modules/${moduleSlug}`;
}

function pageHref(moduleSlug, pageSlug) {
  return `#/modules/${moduleSlug}/pages/${pageSlug}`;
}

function formatMark(mark) {
  return escapeHtml(mark || "").replace(/\n/g, "<br>");
}

function renderTopNav(topNav) {
  return `
    <header class="topbar">
      <button class="round-button" type="button" aria-label="Menu">☰</button>
      <nav class="capsule-nav">
        ${topNav
          .map(
            (item, index) => `
              <span class="capsule-link ${index === 0 ? "is-active" : ""}">
                <span class="capsule-icon">${icon(item.icon)}</span>
                ${escapeHtml(item.label)}
              </span>
            `,
          )
          .join("")}
      </nav>
      <button class="round-button" type="button" aria-label="Account">↗</button>
    </header>
  `;
}

function renderLibrary(manifest, modules) {
  const hero = manifest.expression.library?.hero || {};
  const quickLinks = manifest.expression.library?.quickLinks || [];
  const topNav = manifest.expression.library?.topNav || [];
  const app = document.querySelector("#app");

  applyScene({
    palette: {
      background: "#ececec",
      backgroundSoft: "#f8f8f8",
      panel: "rgba(255,255,255,0.84)",
      text: "#242424",
      muted: "#6e6e6e",
      heroStart: "#4f84d3",
      heroEnd: "#5776ce",
      cardStart: "#4f84d3",
      cardEnd: "#5776ce",
      cloud: "rgba(255,255,255,0.72)",
    },
  });

  app.innerHTML = `
    <div class="screen screen-library">
      ${renderTopNav(topNav)}

      <section class="library-hero">
        <div class="rainbow"></div>
        <div class="logo-lockup">
          <div class="logo-kicker">THE</div>
          <h1 class="logo-title">${escapeHtml(hero.rainbowLabel || manifest.expression.title)}</h1>
          <div class="logo-subtitle">${escapeHtml(hero.subtitle || manifest.island.island.name)}</div>
        </div>
      </section>

      <section class="series-stack">
        ${modules
          .map(
            (module) => `
              <a
                href="${moduleHref(module.slug)}"
                class="series-card ${module.status === "locked" ? "is-locked" : ""}"
                style="--series-start:${module.scene.palette?.cardStart}; --series-end:${module.scene.palette?.cardEnd}; --series-cloud:${module.scene.palette?.cloud};"
              >
                <div class="series-clouds"></div>
                <div class="series-copy">
                  <div class="series-label">${escapeHtml(module.presentation?.libraryLabel || module.title)}</div>
                  <div class="series-mark">${formatMark(module.presentation?.libraryMark || module.title)}</div>
                </div>
                <div class="series-status ${module.status === "locked" ? "is-locked" : "is-open"}">
                  ${module.status === "locked" ? "🔒" : "✔"}
                </div>
              </a>
            `,
          )
          .join("")}
      </section>

      <section class="quick-links">
        ${quickLinks
          .map(
            (item) => `
              <div class="quick-link">
                <div class="quick-emoji">${escapeHtml(item.emoji || "•")}</div>
                <div class="quick-label">${escapeHtml(item.label)}</div>
              </div>
            `,
          )
          .join("")}
      </section>
    </div>
  `;
}

function renderBlock(block) {
  if (block.type === "richText") {
    return `
      <section class="content-card">
        ${block.title ? `<div class="section-eyebrow">${escapeHtml(block.title)}</div>` : ""}
        <div class="rich-text">${markdownToHtml(block.markdown || "")}</div>
      </section>
    `;
  }

  if (block.type === "quote") {
    return `
      <section class="content-card quote-card">
        <div class="section-eyebrow">Reflection</div>
        <blockquote>${escapeHtml(block.quote)}</blockquote>
        ${block.attribution ? `<div class="quote-source">${escapeHtml(block.attribution)}</div>` : ""}
      </section>
    `;
  }

  if (block.type === "video") {
    return `
      <section class="content-card">
        <div class="section-eyebrow">${escapeHtml(block.label || "Practice Video")}</div>
        <div class="video-placeholder">${escapeHtml(block.placeholder || "Guided Practice")}</div>
        <div class="video-description">${escapeHtml(block.description || "")}</div>
      </section>
    `;
  }

  if (block.type === "cta") {
    return `
      <section class="content-card cta-card">
        <div class="section-eyebrow">${escapeHtml(block.kicker || "Continue")}</div>
        <h3>${escapeHtml(block.title)}</h3>
        <p>${escapeHtml(block.body)}</p>
        <a class="pill-button" href="${block.href}">${escapeHtml(block.label)}</a>
      </section>
    `;
  }

  return "";
}

function renderPageTabs(module, activePageSlug) {
  return `
    <div class="page-tabs">
      ${module.pages
        .map(
          (page) => `
            <button
              class="page-tab ${page.slug === activePageSlug ? "is-active" : ""}"
              type="button"
              data-module-slug="${module.slug}"
              data-page-slug="${page.slug}"
            >
              ${escapeHtml(page.title)}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderModuleDetail(manifest, module, page) {
  const app = document.querySelector("#app");
  applyScene(module.scene);

  app.innerHTML = `
    <div class="screen screen-detail">
      ${renderTopNav(manifest.expression.library?.topNav || [])}

      <section class="detail-hero">
        <div class="hero-cloud-layer hero-cloud-a"></div>
        <div class="hero-cloud-layer hero-cloud-b"></div>
        <div class="detail-center">
          <div class="detail-icon">${icon(module.presentation?.detailIcon)}</div>
          <h1 class="detail-title">${formatMark(module.presentation?.detailTitle || module.title)}</h1>
          <div class="detail-level">${escapeHtml(module.level || "Series")}</div>
        </div>
      </section>

      <section class="detail-body">
        <div class="content-column">
          <div class="section-header">
            <div class="section-eyebrow">${escapeHtml(module.title)}</div>
            <h2>Start Here</h2>
            <p class="section-copy">${escapeHtml(page.summary)}</p>
          </div>

          ${renderPageTabs(module, page.slug)}

          <div class="content-stack">
            ${page.blocks.map(renderBlock).join("")}
          </div>
        </div>

        <aside class="detail-sidebar">
          <div class="sidebar-card">
            <div class="section-eyebrow">Series</div>
            <h3>${escapeHtml(module.title)}</h3>
            <p>${escapeHtml(module.description)}</p>
          </div>
          <div class="sidebar-card">
            <div class="section-eyebrow">Scene</div>
            <h3>${escapeHtml(module.scene.name)}</h3>
            <p>${escapeHtml(module.scene.atmosphere)}</p>
          </div>
          <a class="pill-button secondary" href="#/">Back to library</a>
        </aside>
      </section>
    </div>
  `;

  app.querySelectorAll("[data-page-slug]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.hash = pageHref(button.dataset.moduleSlug, button.dataset.pageSlug);
    });
  });
}

function renderError(error) {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <div class="screen screen-library">
      <section class="content-card">
        <div class="section-eyebrow">Renderer error</div>
        <h2>The renderer could not load this island folder.</h2>
        <p>${escapeHtml(error.message)}</p>
      </section>
    </div>
  `;
}

async function renderRoute() {
  try {
    const manifest = await loadManifest();
    const modules = await loadModules();
    const route = parseHash();

    if (route.view === "module") {
      const module = modules.find((item) => item.slug === route.moduleSlug) || modules[0];
      const pageSlug = route.pageSlug || module.entryPage || module.pages[0].slug;
      const page = await loadPage(module, pageSlug);
      renderModuleDetail(manifest, module, page);
      return;
    }

    renderLibrary(manifest, modules);
  } catch (error) {
    renderError(error);
  }
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", renderRoute);
