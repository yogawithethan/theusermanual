const ICONS = [
  { value: "sparkles", glyph: "✦", label: "Sparkles" },
  { value: "cloud", glyph: "☁", label: "Cloud" },
  { value: "sun", glyph: "☼", label: "Sun" },
  { value: "moon", glyph: "☾", label: "Moon" },
  { value: "star", glyph: "★", label: "Star" },
  { value: "heart", glyph: "♥", label: "Heart" },
  { value: "bolt", glyph: "⚡", label: "Bolt" },
];

const PART_COPY = {
  shell: {
    title: "Card Shell",
    copy: "Shape the card itself: color, border, and corner feel.",
  },
  icon: {
    title: "Icon",
    copy: "Choose the symbol that sets the mood for the card.",
  },
  title: {
    title: "Title",
    copy: "Edit the headline directly and fine-tune its look here.",
  },
  description: {
    title: "Description",
    copy: "Adjust the supporting copy and its color.",
  },
};

const state = {
  appName: "Islands • Sandbox",
  cardPath: "",
  savedCard: null,
  card: null,
  selectedPart: "shell",
  dirty: false,
  saving: false,
};

const elements = {
  currentCardName: document.querySelector("#current-card-name"),
  saveState: document.querySelector("#save-state"),
  saveButton: document.querySelector("#save-button"),
  card: document.querySelector("#editor-card"),
  cardIcon: document.querySelector("#card-icon"),
  cardTitle: document.querySelector("#card-title"),
  cardDescription: document.querySelector("#card-description"),
  panelTitle: document.querySelector("#panel-title"),
  panelCopy: document.querySelector("#panel-copy"),
  controlsHost: document.querySelector("#controls-host"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function iconMeta(value) {
  return ICONS.find((icon) => icon.value === value) || ICONS[0];
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function markDirty() {
  state.dirty = true;
  renderTopbar();
}

function selectPart(part) {
  state.selectedPart = part;
  renderSelection();
  renderPanel();
}

function renderTopbar() {
  elements.currentCardName.textContent = state.card?.title || "Untitled Card";

  if (state.saving) {
    elements.saveState.textContent = "Saving…";
  } else if (state.dirty) {
    elements.saveState.textContent = "Unsaved changes";
  } else if (state.card) {
    elements.saveState.textContent = "All changes saved";
  } else {
    elements.saveState.textContent = "Loading…";
  }

  elements.saveButton.disabled = !state.card || state.saving || !state.dirty;
}

function renderCard() {
  if (!state.card) {
    return;
  }

  const { style } = state.card;
  const icon = iconMeta(state.card.icon);

  elements.card.style.setProperty("--card-background", style.backgroundColor);
  elements.card.style.setProperty("--card-border-color", style.borderColor);
  elements.card.style.setProperty("--card-border-width", `${style.borderWidth}px`);
  elements.card.style.setProperty("--card-radius", `${style.radius}px`);
  elements.card.style.setProperty("--card-title-color", style.titleColor);
  elements.card.style.setProperty("--card-description-color", style.descriptionColor);
  elements.card.style.setProperty("--card-title-size", `${style.titleSize}px`);

  elements.cardIcon.textContent = icon.glyph;
  elements.cardIcon.setAttribute("aria-label", `${icon.label} icon`);

  if (elements.cardTitle.textContent !== state.card.title) {
    elements.cardTitle.textContent = state.card.title;
  }
  if (elements.cardDescription.innerText.trim() !== state.card.description) {
    elements.cardDescription.innerText = state.card.description;
  }
}

function renderSelection() {
  elements.card.classList.toggle("is-selected", state.selectedPart === "shell");
  elements.cardIcon.classList.toggle("is-selected", state.selectedPart === "icon");
  elements.cardTitle.classList.toggle("is-selected", state.selectedPart === "title");
  elements.cardDescription.classList.toggle("is-selected", state.selectedPart === "description");
}

function panelSectionTitle() {
  return PART_COPY[state.selectedPart] || PART_COPY.shell;
}

function renderShellControls() {
  const { style } = state.card;
  return `
    <div class="control-group">
      <label class="control-field">
        <span>Background color</span>
        <input type="color" data-field="backgroundColor" value="${style.backgroundColor}" />
      </label>

      <label class="control-field">
        <span>Border color</span>
        <input type="color" data-field="borderColor" value="${style.borderColor}" />
      </label>

      <label class="control-field">
        <span>Border width <strong data-value-label="borderWidth">${style.borderWidth}px</strong></span>
        <input type="range" min="0" max="12" step="1" data-field="borderWidth" value="${style.borderWidth}" />
      </label>

      <label class="control-field">
        <span>Corner radius <strong data-value-label="radius">${style.radius}px</strong></span>
        <input type="range" min="0" max="80" step="1" data-field="radius" value="${style.radius}" />
      </label>
    </div>
  `;
}

function renderTitleControls() {
  const { style } = state.card;
  return `
    <div class="control-group">
      <label class="control-field">
        <span>Title text</span>
        <input type="text" data-field="title" value="${escapeHtml(state.card.title)}" />
      </label>

      <label class="control-field">
        <span>Title color</span>
        <input type="color" data-field="titleColor" value="${style.titleColor}" />
      </label>

      <label class="control-field">
        <span>Title size <strong data-value-label="titleSize">${style.titleSize}px</strong></span>
        <input type="range" min="20" max="72" step="1" data-field="titleSize" value="${style.titleSize}" />
      </label>
    </div>
  `;
}

function renderDescriptionControls() {
  const { style } = state.card;
  return `
    <div class="control-group">
      <label class="control-field">
        <span>Description</span>
        <textarea rows="6" data-field="description">${escapeHtml(state.card.description)}</textarea>
      </label>

      <label class="control-field">
        <span>Description color</span>
        <input type="color" data-field="descriptionColor" value="${style.descriptionColor}" />
      </label>
    </div>
  `;
}

function renderIconControls() {
  return `
    <div class="control-group">
      <div class="control-field">
        <span>Choose an icon</span>
        <div class="icon-grid">
          ${ICONS.map((icon) => `
            <button
              type="button"
              class="icon-option ${icon.value === state.card.icon ? "is-active" : ""}"
              data-icon="${icon.value}"
              aria-label="${escapeHtml(icon.label)}"
            >
              <span class="icon-glyph">${icon.glyph}</span>
              <span class="icon-label">${escapeHtml(icon.label)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderPanel() {
  if (!state.card) {
    return;
  }

  const section = panelSectionTitle();
  elements.panelTitle.textContent = section.title;
  elements.panelCopy.textContent = section.copy;

  if (state.selectedPart === "title") {
    elements.controlsHost.innerHTML = renderTitleControls();
    return;
  }
  if (state.selectedPart === "description") {
    elements.controlsHost.innerHTML = renderDescriptionControls();
    return;
  }
  if (state.selectedPart === "icon") {
    elements.controlsHost.innerHTML = renderIconControls();
    return;
  }
  elements.controlsHost.innerHTML = renderShellControls();
}

function render() {
  renderTopbar();
  renderCard();
  renderSelection();
  renderPanel();
}

function updateTitleFromCard() {
  if (!state.card) {
    return;
  }
  const next = elements.cardTitle.textContent.replace(/\s+/g, " ").trim();
  state.card.title = next || "Untitled Card";
  markDirty();
  renderTopbar();
  if (state.selectedPart === "title") {
    renderPanel();
  }
}

function updateDescriptionFromCard() {
  if (!state.card) {
    return;
  }
  state.card.description = elements.cardDescription.innerText.replace(/\n{3,}/g, "\n\n").trim();
  markDirty();
  if (state.selectedPart === "description") {
    renderPanel();
  }
}

async function loadCard() {
  const payload = await api("/api/card");
  state.appName = payload.appName;
  state.cardPath = payload.cardPath;
  state.savedCard = payload.card;
  state.card = structuredClone(payload.card);
  state.dirty = false;
  state.saving = false;
  render();
}

async function saveCard() {
  if (!state.card || state.saving) {
    return;
  }
  state.saving = true;
  renderTopbar();

  try {
    const payload = await api("/api/card", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state.card),
    });
    state.savedCard = payload.card;
    state.card = structuredClone(payload.card);
    state.dirty = false;
    state.saving = false;
    render();
  } catch (error) {
    state.saving = false;
    renderTopbar();
    window.alert(error.message);
  }
}

elements.saveButton.addEventListener("click", async () => {
  await saveCard();
});

elements.card.addEventListener("click", (event) => {
  if (event.target === elements.card) {
    selectPart("shell");
  }
});

elements.cardIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  selectPart("icon");
});

elements.cardTitle.addEventListener("click", (event) => {
  event.stopPropagation();
  selectPart("title");
});

elements.cardDescription.addEventListener("click", (event) => {
  event.stopPropagation();
  selectPart("description");
});

elements.cardTitle.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    elements.cardTitle.blur();
  }
});

elements.cardTitle.addEventListener("input", () => {
  updateTitleFromCard();
});

elements.cardTitle.addEventListener("blur", () => {
  updateTitleFromCard();
  renderCard();
});

elements.cardDescription.addEventListener("input", () => {
  updateDescriptionFromCard();
});

elements.cardDescription.addEventListener("blur", () => {
  updateDescriptionFromCard();
  renderCard();
});

elements.controlsHost.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return;
  }
  if (!state.card) {
    return;
  }

  const field = target.dataset.field;
  if (!field) {
    return;
  }

  if (field === "title") {
    state.card.title = target.value || "Untitled Card";
  } else if (field === "description") {
    state.card.description = target.value;
  } else if (field === "titleColor") {
    state.card.style.titleColor = target.value;
  } else if (field === "descriptionColor") {
    state.card.style.descriptionColor = target.value;
  } else if (field === "backgroundColor") {
    state.card.style.backgroundColor = target.value;
  } else if (field === "borderColor") {
    state.card.style.borderColor = target.value;
  } else if (field === "borderWidth") {
    state.card.style.borderWidth = Number(target.value);
  } else if (field === "radius") {
    state.card.style.radius = Number(target.value);
  } else if (field === "titleSize") {
    state.card.style.titleSize = Number(target.value);
  }

  markDirty();
  renderCard();

  if (field === "title") {
    renderTopbar();
  }

  if (target instanceof HTMLInputElement && target.type === "range") {
    const label = elements.controlsHost.querySelector(`[data-value-label="${field}"]`);
    if (label) {
      label.textContent = `${target.value}px`;
    }
  }
});

elements.controlsHost.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }
  const button = event.target.closest("[data-icon]");
  if (!button || !state.card) {
    return;
  }
  state.card.icon = button.dataset.icon;
  markDirty();
  render();
});

loadCard().catch((error) => {
  elements.currentCardName.textContent = "Unable to load";
  elements.saveState.textContent = error.message;
});
