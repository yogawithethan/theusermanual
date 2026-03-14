const FONT_OPTIONS = [
  "Avenir Next",
  "Poppins",
  "Trebuchet MS",
  "Georgia",
  "Gill Sans",
  "Helvetica Neue",
  "Verdana",
];

const ICON_OPTIONS = [
  { value: null, label: "None", glyph: "○" },
  { value: "sparkles", label: "Sparkles", glyph: "✦" },
  { value: "cloud", label: "Cloud", glyph: "☁" },
  { value: "sun", label: "Sun", glyph: "☼" },
  { value: "moon", label: "Moon", glyph: "☾" },
  { value: "mountain", label: "Mountain", glyph: "△" },
  { value: "wave", label: "Wave", glyph: "≈" },
  { value: "bolt", label: "Bolt", glyph: "⚡" },
  { value: "heart", label: "Heart", glyph: "♥" },
  { value: "star", label: "Star", glyph: "★" },
];

const TYPE_NAMES = {
  layer1: "Layer One",
  layer2: "Layer Two",
  layer3: "Layer Three",
  layer4: "Layer Four",
  content: "Content Page",
};

const state = {
  device: "desktop",
  editor: null,
  drafts: {
    node: null,
    theme: null,
    scene: null,
    content: "",
  },
  createDraft: null,
  nodeSlugTouched: false,
  createSlugTouched: false,
  toastTimer: null,
};

const elements = {
  status: document.querySelector("#status-pill"),
  columns: document.querySelector("#columns"),
  canvasTitle: document.querySelector("#canvas-title"),
  selectionLabel: document.querySelector("#selection-label"),
  breadcrumb: document.querySelector("#breadcrumb-trail"),
  canvasActions: document.querySelector("#canvas-actions"),
  canvasFrame: document.querySelector("#canvas-frame"),
  canvasPreview: document.querySelector("#canvas-preview"),
  deviceSwitch: document.querySelector("#device-switch"),
  storyPanel: document.querySelector("#story-panel"),
  storyEditor: document.querySelector("#story-editor"),
  saveContent: document.querySelector("#save-content"),
  createSheet: document.querySelector("#create-sheet"),
  createTitle: document.querySelector("#create-title"),
  createForm: document.querySelector("#create-form"),
  createType: document.querySelector("#create-type"),
  createName: document.querySelector("#create-name"),
  createSlug: document.querySelector("#create-slug"),
  createDescription: document.querySelector("#create-description"),
  createIconGrid: document.querySelector("#create-icon-grid"),
  cancelCreate: document.querySelector("#cancel-create"),
  cancelCreateSecondary: document.querySelector("#cancel-create-secondary"),
  nodeForm: document.querySelector("#node-form"),
  nodeTitle: document.querySelector("#node-title"),
  nodeSlug: document.querySelector("#node-slug"),
  nodeDescription: document.querySelector("#node-description"),
  nodeTemplate: document.querySelector("#node-template"),
  nodeIconGrid: document.querySelector("#node-icon-grid"),
  themeForm: document.querySelector("#theme-form"),
  sceneForm: document.querySelector("#scene-form"),
  toast: document.querySelector("#toast"),
  themeHeadingFont: document.querySelector("#theme-heading-font"),
  themeSubheadingFont: document.querySelector("#theme-subheading-font"),
  themeBodyFont: document.querySelector("#theme-body-font"),
  themeBackground: document.querySelector("#theme-background"),
  themeAccent: document.querySelector("#theme-accent"),
  themeText: document.querySelector("#theme-text"),
  themeMuted: document.querySelector("#theme-muted"),
  themeBorder: document.querySelector("#theme-border"),
  themeShadowColor: document.querySelector("#theme-shadow-color"),
  themeRadius: document.querySelector("#theme-radius"),
  themeRadiusValue: document.querySelector("#theme-radius-value"),
  themeBorderWidth: document.querySelector("#theme-border-width"),
  themeBorderWidthValue: document.querySelector("#theme-border-width-value"),
  themeShadowY: document.querySelector("#theme-shadow-y"),
  themeShadowYValue: document.querySelector("#theme-shadow-y-value"),
  themeShadowBlur: document.querySelector("#theme-shadow-blur"),
  themeShadowBlurValue: document.querySelector("#theme-shadow-blur-value"),
  themeShadowOpacity: document.querySelector("#theme-shadow-opacity"),
  themeShadowOpacityValue: document.querySelector("#theme-shadow-opacity-value"),
  themeUppercase: document.querySelector("#theme-uppercase"),
  themeUnderline: document.querySelector("#theme-underline"),
  themeItalic: document.querySelector("#theme-italic"),
  themeBoldHeading: document.querySelector("#theme-bold-heading"),
  sceneBackgroundType: document.querySelector("#scene-background-type"),
  sceneBackgroundValue: document.querySelector("#scene-background-value"),
  sceneLayout: document.querySelector("#scene-layout"),
  sceneDirection: document.querySelector("#scene-direction"),
  sceneAlign: document.querySelector("#scene-align"),
  sceneGap: document.querySelector("#scene-gap"),
  sceneGapValue: document.querySelector("#scene-gap-value"),
  sceneShowMenu: document.querySelector("#scene-show-menu"),
  sceneShowSearch: document.querySelector("#scene-show-search"),
  sceneShowAccount: document.querySelector("#scene-show-account"),
  sceneShowCanvas: document.querySelector("#scene-show-canvas"),
  sceneDeviceFrame: document.querySelector("#scene-device-frame"),
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function iconFor(value) {
  return ICON_OPTIONS.find((icon) => icon.value === value) || ICON_OPTIONS[0];
}

function getLayerLabel(type) {
  return state.editor?.sandbox?.layerLabels?.[type] || TYPE_NAMES[type] || type;
}

function selectedNode() {
  return state.editor?.preview?.node || null;
}

function workingNode() {
  const node = selectedNode();
  if (!node || node.type === "root" || !state.drafts.node) {
    return node;
  }
  return { ...node, ...state.drafts.node };
}

function workingTheme() {
  return state.drafts.theme || state.editor?.theme || null;
}

function workingScene() {
  return state.drafts.scene || state.editor?.scene || null;
}

function childNodesFor(nodeId) {
  if (!state.editor) {
    return [];
  }
  const nodesById = new Map(state.editor.nodes.map((node) => [node.id, node]));
  const current = nodeId === "root" ? { children: state.editor.sandbox.rootChildren } : nodesById.get(nodeId);
  return (current?.children || []).map((childId) => nodesById.get(childId)).filter(Boolean);
}

function previewContentHtml(content) {
  if (!content || !content.trim()) {
    return '<p class="empty-copy">This page is empty. Add story copy to bring it to life.</p>';
  }

  const lines = content.split("\n");
  const parts = [];
  let listItems = [];

  function flushList() {
    if (listItems.length > 0) {
      parts.push(`<ul>${listItems.join("")}</ul>`);
      listItems = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      parts.push(`<h4>${escapeHtml(line.slice(3))}</h4>`);
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      parts.push(`<h3>${escapeHtml(line.slice(2))}</h3>`);
      continue;
    }
    if (line.startsWith("- ")) {
      listItems.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }
    flushList();
    parts.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushList();
  return parts.join("");
}

function rgbaToColorAndOpacity(input) {
  if (!input) {
    return { hex: "#000000", opacity: 12 };
  }
  if (input.startsWith("#")) {
    return { hex: input, opacity: 100 };
  }
  const match = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i);
  if (!match) {
    return { hex: "#000000", opacity: 12 };
  }
  const [, red, green, blue, alpha] = match;
  const hex = `#${[red, green, blue]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")}`;
  return { hex, opacity: Math.round((alpha === undefined ? 1 : Number(alpha)) * 100) };
}

function hexToRgba(hex, opacityPercent) {
  const safeHex = hex.replace("#", "");
  const channels = safeHex.length === 3
    ? safeHex.split("").map((value) => Number.parseInt(`${value}${value}`, 16))
    : [0, 2, 4].map((index) => Number.parseInt(safeHex.slice(index, index + 2), 16));
  const alpha = Math.max(0, Math.min(1, opacityPercent / 100));
  return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha.toFixed(2)})`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

async function loadEditorState(selectedNodeId = state.editor?.selectedNodeId ?? null) {
  const url = new URL("/api/editor-state", window.location.origin);
  if (selectedNodeId) {
    url.searchParams.set("selectedNodeId", selectedNodeId);
  }
  url.searchParams.set("device", state.device);

  const payload = await api(url.pathname + url.search);
  state.editor = payload;
  state.device = payload.preview.device || state.device;
  state.nodeSlugTouched = false;
  state.createSlugTouched = false;
  state.createDraft = null;

  const node = payload.preview.node;
  state.drafts.node =
    node.type === "root"
      ? null
      : {
          title: node.title,
          slug: node.slug,
          description: node.description || "",
          icon: node.icon || null,
          template: node.template,
        };
  state.drafts.theme = clone(payload.theme);
  state.drafts.scene = clone(payload.scene);
  state.drafts.content = payload.content || "";

  renderEverything();
}

function applyThemeToShell() {
  const theme = workingTheme();
  if (!theme) {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty("--world-background", theme.colors.background);
  root.style.setProperty("--world-accent", theme.colors.accent);
  root.style.setProperty("--world-text", theme.colors.text);
  root.style.setProperty("--world-muted", theme.colors.muted);
  root.style.setProperty("--world-border", theme.colors.border);
  root.style.setProperty("--world-radius", `${theme.card.radius}px`);
  root.style.setProperty("--world-border-width", `${theme.card.borderWidth}px`);
  root.style.setProperty("--world-shadow", `${theme.card.shadow.x}px ${theme.card.shadow.y}px ${theme.card.shadow.blur}px ${theme.card.shadow.spread}px ${theme.card.shadow.color}`);
  root.style.setProperty("--heading-font", `"${theme.fonts.heading}", "Avenir Next", sans-serif`);
  root.style.setProperty("--body-font", `"${theme.fonts.body}", "Avenir Next", sans-serif`);
}

function renderStatus() {
  if (!state.editor) {
    elements.status.textContent = "Loading local sandbox…";
    return;
  }
  const sandboxName = state.editor.sandboxPath.split("/").pop();
  elements.status.textContent = `${state.editor.appName} • ${sandboxName} • local only`;
}

function renderDeviceButtons() {
  elements.deviceSwitch.querySelectorAll("[data-device]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.device === state.device);
  });
}

function selectedActionButtons() {
  if (!state.editor) {
    return "";
  }

  const actions = state.editor.actions;
  const createLabel = actions.allowedChildTypes[0] ? getLayerLabel(actions.allowedChildTypes[0]) : "child";

  return `
    ${actions.canCreateChildren ? `<button type="button" class="mini-action" data-action="create">New ${escapeHtml(createLabel)}</button>` : ""}
    ${actions.canDuplicate ? '<button type="button" class="mini-action" data-action="duplicate">Duplicate</button>' : ""}
    ${actions.canDelete ? '<button type="button" class="mini-action danger" data-action="delete">Delete</button>' : ""}
  `;
}

function renderExplorer() {
  if (!state.editor) {
    elements.columns.innerHTML = "";
    return;
  }

  elements.columns.innerHTML = state.editor.columns
    .map((column) => {
      const countLabel = `${column.nodes.length} ${column.nodes.length === 1 ? "card" : "cards"}`;
      return `
        <section class="layer-column">
          <div class="column-head">
            <div>
              <div class="eyebrow">${escapeHtml(column.label)}</div>
              <strong>${escapeHtml(countLabel)}</strong>
            </div>
          </div>

          <div class="column-cards">
            ${column.nodes
              .map((node) => {
                const icon = iconFor(node.icon);
                const selected = node.id === state.editor.selectedNodeId;
                return `
                  <div class="world-card-shell ${selected ? "is-selected" : ""}">
                    <button type="button" class="world-card" data-select-node="${node.id}" data-node-type="${node.type}">
                      <span class="world-card-icon">${escapeHtml(icon.glyph)}</span>
                      <span class="world-card-copy">
                        <span class="world-card-title">${escapeHtml(node.title)}</span>
                        <span class="world-card-subtitle">${escapeHtml(node.description || TYPE_NAMES[node.type])}</span>
                      </span>
                    </button>
                    ${selected ? `<div class="world-card-actions">${selectedActionButtons()}</div>` : ""}
                  </div>
                `;
              })
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderBreadcrumb() {
  const chain = state.editor?.preview?.ancestorChain?.filter((node) => node.type !== "root") || [];
  elements.breadcrumb.innerHTML = chain
    .map((node) => `<span class="crumb">${escapeHtml(node.title)}</span>`)
    .join('<span class="crumb-separator">/</span>');
}

function renderCanvasHeader() {
  const node = workingNode();
  if (!node || node.type === "root") {
    elements.selectionLabel.textContent = "Canvas";
    elements.canvasTitle.textContent = "Choose a card to start";
    elements.canvasActions.innerHTML = "";
    return;
  }

  elements.selectionLabel.textContent = `${getLayerLabel(node.type)} • ${TYPE_NAMES[node.type]}`;
  elements.canvasTitle.textContent = node.title;
  elements.canvasActions.innerHTML = selectedActionButtons();
}

function renderBranchPreview(node, theme, scene) {
  const icon = iconFor(node.icon);
  const children = childNodesFor(node.id);
  const headingClasses = [
    theme.effects.uppercase ? "is-uppercase" : "",
    theme.effects.underline ? "is-underlined" : "",
    theme.effects.italic ? "is-italic" : "",
    theme.effects.boldHeading ? "is-bold" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const childMarkup = children.length
    ? `
      <div class="preview-children ${scene.nodeLayout.direction === "horizontal" ? "is-horizontal" : ""}" style="--child-gap:${scene.nodeLayout.gap}px">
        ${children
          .map((child) => `
            <div class="preview-child" data-child-type="${child.type}">
              <span class="preview-child-label">${escapeHtml(child.title)}</span>
              <span class="preview-child-meta">${escapeHtml(getLayerLabel(child.type))}</span>
            </div>
          `)
          .join("")}
      </div>
    `
    : '<div class="empty-copy">This card is ready for the next layer.</div>';

  return `
    <div class="stage-shell stage-branch">
      <div class="preview-nav">
        ${scene.navigation.showMenu ? '<span class="nav-chip">Menu</span>' : ""}
        ${scene.navigation.showSearch ? '<span class="nav-chip">Search</span>' : ""}
        ${scene.navigation.showAccount ? '<span class="nav-chip">Account</span>' : ""}
      </div>

      <article class="hero-card template-${node.template}" data-card-type="${node.type}">
        <div class="hero-icon">${escapeHtml(icon.glyph)}</div>
        <div class="hero-copy">
          <p class="hero-kicker">${escapeHtml(getLayerLabel(node.type))}</p>
          <h3 class="${headingClasses}">${escapeHtml(node.title)}</h3>
          <p>${escapeHtml(node.description || "Describe what lives inside this layer.")}</p>
        </div>
      </article>

      ${childMarkup}
    </div>
  `;
}

function renderContentPreview(node, theme, scene) {
  const headingClasses = [
    theme.effects.uppercase ? "is-uppercase" : "",
    theme.effects.underline ? "is-underlined" : "",
    theme.effects.italic ? "is-italic" : "",
    theme.effects.boldHeading ? "is-bold" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="stage-shell stage-content">
      <div class="preview-nav">
        ${scene.navigation.showMenu ? '<span class="nav-chip">Menu</span>' : ""}
        ${scene.navigation.showSearch ? '<span class="nav-chip">Search</span>' : ""}
        ${scene.navigation.showAccount ? '<span class="nav-chip">Account</span>' : ""}
      </div>

      <article class="content-page template-${node.template}">
        <div class="content-hero">
          <span class="content-pill">${escapeHtml(getLayerLabel(node.type))}</span>
          <h3 class="${headingClasses}">${escapeHtml(node.title)}</h3>
          <p>${escapeHtml(node.description || "Use this page to tell the story of the selected content.")}</p>
        </div>

        <div class="content-body">
          ${previewContentHtml(state.drafts.content)}
        </div>
      </article>
    </div>
  `;
}

function renderCanvas() {
  const node = workingNode();
  const theme = workingTheme();
  const scene = workingScene();

  if (!node || !theme || !scene || node.type === "root") {
    elements.canvasPreview.innerHTML = '<div class="empty-copy center">Select a card from the explorer to begin shaping the world.</div>';
    return;
  }

  elements.canvasFrame.className = `canvas-frame device-${state.device}`;
  elements.canvasFrame.dataset.backgroundType = scene.background.type;
  elements.canvasFrame.dataset.backgroundValue = scene.background.value;

  if (!scene.preview.showCanvas) {
    elements.canvasPreview.innerHTML =
      '<div class="empty-copy center">Canvas preview is hidden right now. Turn it back on in Scene controls whenever you want to see the world again.</div>';
    return;
  }

  if (node.type === "content") {
    elements.canvasPreview.innerHTML = renderContentPreview(node, theme, scene);
  } else {
    elements.canvasPreview.innerHTML = renderBranchPreview(node, theme, scene);
  }
}

function renderStoryPanel() {
  const node = workingNode();
  const isContent = node?.type === "content";
  elements.storyPanel.classList.toggle("hidden", !isContent);
  elements.storyEditor.disabled = !isContent;
  if (isContent) {
    elements.storyEditor.value = state.drafts.content;
  } else {
    elements.storyEditor.value = "";
  }
}

function renderCreateSheet() {
  const isOpen = Boolean(state.createDraft);
  elements.createSheet.classList.toggle("hidden", !isOpen);

  if (!isOpen) {
    return;
  }

  const createTypeLabel = getLayerLabel(state.createDraft.type);
  elements.createTitle.textContent = `New ${createTypeLabel}`;

  elements.createType.innerHTML = state.editor.actions.allowedChildTypes
    .map((type) => `<option value="${type}" ${type === state.createDraft.type ? "selected" : ""}>${escapeHtml(getLayerLabel(type))}</option>`)
    .join("");
  elements.createName.value = state.createDraft.title;
  elements.createSlug.value = state.createDraft.slug;
  elements.createDescription.value = state.createDraft.description;
  renderIconGrid(elements.createIconGrid, state.createDraft.icon, "create-icon");
}

function renderNodeForm() {
  const node = workingNode();
  const editable = Boolean(node && node.type !== "root" && state.drafts.node);

  elements.nodeForm.classList.toggle("is-disabled", !editable);
  [...elements.nodeForm.querySelectorAll("input, textarea, select, button")].forEach((field) => {
    field.disabled = !editable;
  });

  if (!editable) {
    elements.nodeTitle.value = "";
    elements.nodeSlug.value = "";
    elements.nodeDescription.value = "";
    elements.nodeTemplate.value = "pill-card";
    renderIconGrid(elements.nodeIconGrid, null, "node-icon");
    return;
  }

  elements.nodeTitle.value = state.drafts.node.title;
  elements.nodeSlug.value = state.drafts.node.slug;
  elements.nodeDescription.value = state.drafts.node.description;
  elements.nodeTemplate.value = state.drafts.node.template;
  renderIconGrid(elements.nodeIconGrid, state.drafts.node.icon, "node-icon");
}

function renderIconGrid(container, activeValue, mode) {
  container.innerHTML = ICON_OPTIONS.map((icon) => `
    <button
      type="button"
      class="icon-option ${icon.value === activeValue ? "is-active" : ""}"
      data-${mode}="${icon.value ?? "__none__"}"
      aria-label="${escapeHtml(icon.label)}"
      title="${escapeHtml(icon.label)}"
    >
      <span>${escapeHtml(icon.glyph)}</span>
      <small>${escapeHtml(icon.label)}</small>
    </button>
  `).join("");
}

function renderFontOptions(select, activeValue) {
  select.innerHTML = FONT_OPTIONS.map((font) => `<option value="${font}" ${font === activeValue ? "selected" : ""}>${escapeHtml(font)}</option>`).join("");
}

function renderThemeForm() {
  const theme = workingTheme();
  if (!theme) {
    return;
  }
  const shadow = rgbaToColorAndOpacity(theme.card.shadow.color);

  renderFontOptions(elements.themeHeadingFont, theme.fonts.heading);
  renderFontOptions(elements.themeSubheadingFont, theme.fonts.subheading);
  renderFontOptions(elements.themeBodyFont, theme.fonts.body);

  elements.themeBackground.value = theme.colors.background;
  elements.themeAccent.value = theme.colors.accent;
  elements.themeText.value = theme.colors.text;
  elements.themeMuted.value = theme.colors.muted;
  elements.themeBorder.value = theme.colors.border;
  elements.themeShadowColor.value = shadow.hex;
  elements.themeRadius.value = String(theme.card.radius);
  elements.themeRadiusValue.textContent = `${theme.card.radius}px`;
  elements.themeBorderWidth.value = String(theme.card.borderWidth);
  elements.themeBorderWidthValue.textContent = `${theme.card.borderWidth}px`;
  elements.themeShadowY.value = String(theme.card.shadow.y);
  elements.themeShadowYValue.textContent = `${theme.card.shadow.y}px`;
  elements.themeShadowBlur.value = String(theme.card.shadow.blur);
  elements.themeShadowBlurValue.textContent = `${theme.card.shadow.blur}px`;
  elements.themeShadowOpacity.value = String(shadow.opacity);
  elements.themeShadowOpacityValue.textContent = `${shadow.opacity}%`;
  elements.themeUppercase.checked = theme.effects.uppercase;
  elements.themeUnderline.checked = theme.effects.underline;
  elements.themeItalic.checked = theme.effects.italic;
  elements.themeBoldHeading.checked = theme.effects.boldHeading;
}

function renderSceneForm() {
  const scene = workingScene();
  if (!scene) {
    return;
  }

  elements.sceneBackgroundType.value = scene.background.type;
  elements.sceneBackgroundValue.value = scene.background.value;
  elements.sceneLayout.value = scene.layout;
  elements.sceneDirection.value = scene.nodeLayout.direction;
  elements.sceneAlign.value = scene.nodeLayout.align;
  elements.sceneGap.value = String(scene.nodeLayout.gap);
  elements.sceneGapValue.textContent = `${scene.nodeLayout.gap}px`;
  elements.sceneShowMenu.checked = scene.navigation.showMenu;
  elements.sceneShowSearch.checked = scene.navigation.showSearch;
  elements.sceneShowAccount.checked = scene.navigation.showAccount;
  elements.sceneShowCanvas.checked = scene.preview.showCanvas;
  elements.sceneDeviceFrame.value = scene.preview.deviceFrame;
}

function renderEverything() {
  applyThemeToShell();
  renderStatus();
  renderDeviceButtons();
  renderExplorer();
  renderBreadcrumb();
  renderCanvasHeader();
  renderCanvas();
  renderStoryPanel();
  renderCreateSheet();
  renderNodeForm();
  renderThemeForm();
  renderSceneForm();
}

function showToast(message) {
  elements.toast.hidden = false;
  elements.toast.textContent = message;
  if (state.toastTimer) {
    clearTimeout(state.toastTimer);
  }
  state.toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2400);
}

function openCreateSheet() {
  if (!state.editor?.actions?.canCreateChildren) {
    return;
  }
  const initialType = state.editor.actions.allowedChildTypes[0];
  state.createDraft = {
    parentId: state.editor.selectedNodeId,
    type: initialType,
    title: "",
    slug: "",
    description: "",
    icon: null,
  };
  state.createSlugTouched = false;
  renderCreateSheet();
}

function closeCreateSheet() {
  state.createDraft = null;
  renderCreateSheet();
}

async function saveNode() {
  const node = selectedNode();
  if (!node || node.type === "root" || !state.drafts.node) {
    return;
  }
  await api(`/api/node?nodeId=${encodeURIComponent(node.id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: state.drafts.node.title,
      slug: state.drafts.node.slug,
      description: state.drafts.node.description || null,
      icon: state.drafts.node.icon,
      template: state.drafts.node.template,
    }),
  });
  await loadEditorState(node.id);
  showToast("Card saved");
}

async function saveTheme() {
  const theme = workingTheme();
  if (!theme) {
    return;
  }
  await api("/api/theme", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(theme),
  });
  await loadEditorState(state.editor.selectedNodeId);
  showToast("Theme saved");
}

async function saveScene() {
  const scene = workingScene();
  if (!scene) {
    return;
  }
  await api("/api/scene", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(scene),
  });
  await loadEditorState(state.editor.selectedNodeId);
  showToast("Scene saved");
}

async function saveContent() {
  const node = selectedNode();
  if (!node || node.type !== "content") {
    return;
  }
  await api(`/api/content?nodeId=${encodeURIComponent(node.id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: state.drafts.content }),
  });
  await loadEditorState(node.id);
  showToast("Page copy saved");
}

async function createChild() {
  if (!state.createDraft) {
    return;
  }
  const payload = await api("/api/node", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: state.createDraft.type,
      title: state.createDraft.title,
      slug: state.createDraft.slug || slugify(state.createDraft.title),
      parentId: state.createDraft.parentId,
      description: state.createDraft.description || null,
      icon: state.createDraft.icon,
    }),
  });
  await loadEditorState(payload.id);
  showToast("New card created");
}

async function duplicateSelectedNode() {
  const node = selectedNode();
  if (!node || node.type === "root") {
    return;
  }
  const payload = await api(`/api/node/duplicate?nodeId=${encodeURIComponent(node.id)}`, {
    method: "POST",
  });
  await loadEditorState(payload.id);
  showToast("Card duplicated");
}

async function deleteSelectedNode() {
  const node = selectedNode();
  if (!node || node.type === "root") {
    return;
  }
  const ok = window.confirm(`Delete "${node.title}"? This only works for leaf cards.`);
  if (!ok) {
    return;
  }
  const fallbackParentId = node.parentId || state.editor.sandbox.rootChildren[0] || "root";
  await api(`/api/node?nodeId=${encodeURIComponent(node.id)}`, {
    method: "DELETE",
  });
  await loadEditorState(fallbackParentId);
  showToast("Card deleted");
}

function bindStaticOptions() {
  renderFontOptions(elements.themeHeadingFont, FONT_OPTIONS[0]);
  renderFontOptions(elements.themeSubheadingFont, FONT_OPTIONS[0]);
  renderFontOptions(elements.themeBodyFont, FONT_OPTIONS[0]);
  renderIconGrid(elements.nodeIconGrid, null, "node-icon");
  renderIconGrid(elements.createIconGrid, null, "create-icon");
}

elements.columns.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-select-node], [data-action]");
  if (!target) {
    return;
  }

  if (target.dataset.selectNode) {
    await loadEditorState(target.dataset.selectNode);
    return;
  }

  if (target.dataset.action === "create") {
    openCreateSheet();
    return;
  }

  if (target.dataset.action === "duplicate") {
    await duplicateSelectedNode();
    return;
  }

  if (target.dataset.action === "delete") {
    await deleteSelectedNode();
  }
});

elements.canvasActions.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  if (target.dataset.action === "create") {
    openCreateSheet();
    return;
  }
  if (target.dataset.action === "duplicate") {
    await duplicateSelectedNode();
    return;
  }
  if (target.dataset.action === "delete") {
    await deleteSelectedNode();
  }
});

elements.deviceSwitch.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-device]");
  if (!button) {
    return;
  }
  state.device = button.dataset.device;
  renderDeviceButtons();
  renderCanvas();
});

elements.nodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveNode();
});

elements.nodeTitle.addEventListener("input", () => {
  if (!state.drafts.node) {
    return;
  }
  state.drafts.node.title = elements.nodeTitle.value;
  if (!state.nodeSlugTouched) {
    state.drafts.node.slug = slugify(elements.nodeTitle.value);
    elements.nodeSlug.value = state.drafts.node.slug;
  }
  renderCanvasHeader();
  renderCanvas();
});

elements.nodeSlug.addEventListener("input", () => {
  if (!state.drafts.node) {
    return;
  }
  state.nodeSlugTouched = true;
  state.drafts.node.slug = slugify(elements.nodeSlug.value);
});

elements.nodeDescription.addEventListener("input", () => {
  if (!state.drafts.node) {
    return;
  }
  state.drafts.node.description = elements.nodeDescription.value;
  renderCanvas();
});

elements.nodeTemplate.addEventListener("change", () => {
  if (!state.drafts.node) {
    return;
  }
  state.drafts.node.template = elements.nodeTemplate.value;
  renderCanvas();
});

elements.nodeIconGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-node-icon]");
  if (!button || !state.drafts.node) {
    return;
  }
  state.drafts.node.icon = button.dataset.nodeIcon === "__none__" ? null : button.dataset.nodeIcon;
  renderNodeForm();
  renderCanvas();
});

elements.themeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveTheme();
});

elements.themeForm.addEventListener("input", () => {
  const theme = state.drafts.theme;
  if (!theme) {
    return;
  }

  theme.fonts.heading = elements.themeHeadingFont.value;
  theme.fonts.subheading = elements.themeSubheadingFont.value;
  theme.fonts.body = elements.themeBodyFont.value;
  theme.colors.background = elements.themeBackground.value;
  theme.colors.accent = elements.themeAccent.value;
  theme.colors.text = elements.themeText.value;
  theme.colors.muted = elements.themeMuted.value;
  theme.colors.border = elements.themeBorder.value;
  theme.card.radius = Number(elements.themeRadius.value);
  theme.card.borderWidth = Number(elements.themeBorderWidth.value);
  theme.card.shadow.y = Number(elements.themeShadowY.value);
  theme.card.shadow.blur = Number(elements.themeShadowBlur.value);
  theme.card.shadow.color = hexToRgba(elements.themeShadowColor.value, Number(elements.themeShadowOpacity.value));
  theme.effects.uppercase = elements.themeUppercase.checked;
  theme.effects.underline = elements.themeUnderline.checked;
  theme.effects.italic = elements.themeItalic.checked;
  theme.effects.boldHeading = elements.themeBoldHeading.checked;
  applyThemeToShell();
  renderThemeForm();
  renderCanvasHeader();
  renderCanvas();
});

elements.sceneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveScene();
});

elements.sceneForm.addEventListener("input", () => {
  const scene = state.drafts.scene;
  if (!scene) {
    return;
  }

  scene.background.type = elements.sceneBackgroundType.value;
  scene.background.value = elements.sceneBackgroundValue.value;
  scene.layout = elements.sceneLayout.value;
  scene.nodeLayout.direction = elements.sceneDirection.value;
  scene.nodeLayout.align = elements.sceneAlign.value;
  scene.nodeLayout.gap = Number(elements.sceneGap.value);
  scene.navigation.showMenu = elements.sceneShowMenu.checked;
  scene.navigation.showSearch = elements.sceneShowSearch.checked;
  scene.navigation.showAccount = elements.sceneShowAccount.checked;
  scene.preview.showCanvas = elements.sceneShowCanvas.checked;
  scene.preview.deviceFrame = elements.sceneDeviceFrame.value;
  renderSceneForm();
  renderCanvas();
});

elements.storyEditor.addEventListener("input", () => {
  state.drafts.content = elements.storyEditor.value;
  renderCanvas();
});

elements.saveContent.addEventListener("click", async () => {
  await saveContent();
});

elements.cancelCreate.addEventListener("click", closeCreateSheet);
elements.cancelCreateSecondary.addEventListener("click", closeCreateSheet);

elements.createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await createChild();
});

elements.createType.addEventListener("change", () => {
  if (!state.createDraft) {
    return;
  }
  state.createDraft.type = elements.createType.value;
  renderCreateSheet();
});

elements.createName.addEventListener("input", () => {
  if (!state.createDraft) {
    return;
  }
  state.createDraft.title = elements.createName.value;
  if (!state.createSlugTouched) {
    state.createDraft.slug = slugify(elements.createName.value);
    elements.createSlug.value = state.createDraft.slug;
  }
});

elements.createSlug.addEventListener("input", () => {
  if (!state.createDraft) {
    return;
  }
  state.createSlugTouched = true;
  state.createDraft.slug = slugify(elements.createSlug.value);
});

elements.createDescription.addEventListener("input", () => {
  if (!state.createDraft) {
    return;
  }
  state.createDraft.description = elements.createDescription.value;
});

elements.createIconGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-create-icon]");
  if (!button || !state.createDraft) {
    return;
  }
  state.createDraft.icon = button.dataset.createIcon === "__none__" ? null : button.dataset.createIcon;
  renderCreateSheet();
});

async function init() {
  bindStaticOptions();
  await loadEditorState();
}

init().catch((error) => {
  elements.status.textContent = error.message;
  elements.canvasPreview.innerHTML = `<div class="empty-copy center">${escapeHtml(error.message)}</div>`;
});
