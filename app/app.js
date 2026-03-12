const scenePresets = {
  default: {
    glowA: "rgba(129, 181, 255, 0.22)",
    glowB: "rgba(255, 205, 146, 0.18)",
    glowC: "rgba(92, 124, 250, 0.16)",
    overlay:
      "linear-gradient(120deg, rgba(255,255,255,0.06) 0%, transparent 35%, rgba(255,255,255,0.04) 100%)",
  },
  cosmic: {
    glowA: "rgba(143, 120, 255, 0.28)",
    glowB: "rgba(78, 220, 255, 0.18)",
    glowC: "rgba(255, 194, 120, 0.16)",
    overlay:
      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18) 0 1px, transparent 2px), radial-gradient(circle at 72% 30%, rgba(255,255,255,0.14) 0 1px, transparent 2px), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.1) 0 1px, transparent 2px)",
  },
  ocean: {
    glowA: "rgba(255, 155, 120, 0.26)",
    glowB: "rgba(79, 163, 255, 0.18)",
    glowC: "rgba(255, 226, 173, 0.14)",
    overlay:
      "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 20%, rgba(255,255,255,0.04) 48%, transparent 80%)",
  },
  clouds: {
    glowA: "rgba(255, 247, 220, 0.28)",
    glowB: "rgba(171, 206, 255, 0.18)",
    glowC: "rgba(255, 215, 143, 0.15)",
    overlay:
      "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 20%), radial-gradient(circle at 65% 25%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 50% 65%, rgba(255,255,255,0.12), transparent 24%)",
  },
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

async function loadIslandData() {
  const manifest = await loadJson("../island/content/island.json");
  const moduleSlug = manifest.expression.modules[0];
  const basePath = `../island/content/expressions/${manifest.expression.id}/modules/${moduleSlug}`;
  const [module, scene] = await Promise.all([
    loadJson(`${basePath}/module.json`),
    loadJson(`${basePath}/scene.json`),
  ]);
  const pageSlug = module.pages[0].slug;
  const page = await loadJson(`${basePath}/pages/${pageSlug}.json`);
  const blocks = await Promise.all(
    page.blocks.map(async (block) => {
      if (block.type === "richText" && block.source?.markdown) {
        return {
          ...block,
          markdown: await loadText(`${basePath}/${block.source.markdown}`),
        };
      }
      return block;
    }),
  );

  return {
    manifest,
    module,
    page: { ...page, blocks },
    scene,
  };
}

function escapeHtml(text) {
  return text
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

function renderBlock(block) {
  if (block.type === "richText") {
    return `
      <section class="lesson-block">
        ${block.title ? `<div class="eyebrow">${block.title}</div>` : ""}
        <div class="rich-text">${markdownToHtml(block.markdown || "")}</div>
      </section>
    `;
  }

  if (block.type === "quote") {
    return `
      <section class="quote-block">
        <div class="eyebrow">Reflection</div>
        <blockquote>${escapeHtml(block.quote)}</blockquote>
        ${block.attribution ? `<p class="quote-attribution">${escapeHtml(block.attribution)}</p>` : ""}
      </section>
    `;
  }

  if (block.type === "video") {
    return `
      <section class="video-block">
        <div class="eyebrow">${escapeHtml(block.label || "Practice Video")}</div>
        <div class="video-frame">${escapeHtml(block.placeholder || "Guided Practice")}</div>
        <div class="video-meta">${escapeHtml(block.description || "")}</div>
      </section>
    `;
  }

  if (block.type === "cta") {
    return `
      <section class="lesson-block">
        <div class="eyebrow">${escapeHtml(block.kicker || "Continue")}</div>
        <h3>${escapeHtml(block.title)}</h3>
        <p class="rich-text">${escapeHtml(block.body)}</p>
        <div class="button-row">
          <a class="cta-button" href="${block.href}">${escapeHtml(block.label)}</a>
        </div>
      </section>
    `;
  }

  return "";
}

function renderSceneShell(content, preset) {
  const scene = scenePresets[preset] || scenePresets.default;
  const app = document.querySelector("#app");
  app.innerHTML = `
    <div
      class="scene-shell"
      style="
        --scene-glow-a: ${scene.glowA};
        --scene-glow-b: ${scene.glowB};
        --scene-glow-c: ${scene.glowC};
        --scene-overlay: ${scene.overlay};
      "
    >
      <div class="app-shell">${content}</div>
    </div>
  `;
}

function renderApp({ manifest, module, page, scene }) {
  renderSceneShell(
    `
      <header class="topbar">
        <div class="brand">
          <div class="brand-kicker">${manifest.person.name}</div>
          <div class="brand-title">${manifest.island.name}</div>
        </div>
      </header>

      <main class="hero">
        <div class="eyebrow">${manifest.expression.title}</div>
        <h1 class="hero-title">${module.title}</h1>
        <p class="hero-copy">${module.description}</p>
        <div class="hero-actions">
          <span class="button-link">${module.slug}</span>
          <span class="button-link">${page.kind}</span>
        </div>
      </main>

      <section class="section overview-grid">
        <article class="panel">
          <div class="eyebrow">Loaded module</div>
          <h2 class="section-title">${module.title}</h2>
          <p class="section-copy">${module.pages.length} page definitions found in module.json.</p>
          <div class="module-meta">
            <div><strong>First page:</strong> ${page.title}</div>
            <div><strong>Page slug:</strong> ${page.slug}</div>
          </div>
        </article>

        <aside class="panel">
          <div class="eyebrow">Loaded scene</div>
          <h2>${scene.name}</h2>
          <p class="section-copy">${scene.summary}</p>
          <div class="progress-card">
            <strong>Atmosphere</strong>
            <p class="section-copy">${scene.atmosphere}</p>
          </div>
        </aside>
      </section>

      <section class="section">
        <div class="section-header">
          <div class="eyebrow">Loaded page</div>
          <h2 class="lesson-title">${page.title}</h2>
          <p class="section-copy">${page.summary}</p>
        </div>
        <div class="lesson-grid">
          ${page.blocks.map(renderBlock).join("")}
        </div>
      </section>

      <div class="footer-note">
        Simple renderer: manifest -> first module -> first page from /island/content.
      </div>
    `,
    scene.preset,
  );
}

function renderError(error) {
  renderSceneShell(
    `
      <section class="panel">
        <div class="eyebrow">Renderer error</div>
        <h1 class="section-title">The island content could not be loaded.</h1>
        <p class="section-copy">${escapeHtml(error.message)}</p>
      </section>
    `,
    "default",
  );
}

async function main() {
  try {
    const data = await loadIslandData();
    renderApp(data);
  } catch (error) {
    renderError(error);
  }
}

window.addEventListener("DOMContentLoaded", main);
