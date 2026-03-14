const state = {
  selectedNodeId: null,
  nodes: [],
};

const elements = {
  status: document.querySelector("#status-pill"),
  columns: document.querySelector("#columns"),
  preview: document.querySelector("#preview"),
  metadataForm: document.querySelector("#metadata-form"),
  inspectorTitle: document.querySelector("#inspector-title"),
  contentForm: document.querySelector("#content-form"),
  contentEditor: document.querySelector("#content-editor"),
};

async function api(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function selectedNode() {
  return state.nodes.find((node) => node.id === state.selectedNodeId) || null;
}

function renderColumns(columns) {
  elements.columns.innerHTML = columns
    .map(
      (column) => `
        <section class="column">
          <div class="eyebrow">${column.label}</div>
          <div class="column-list">
            ${column.nodes
              .map(
                (node) => `
                  <button class="node-button ${node.id === state.selectedNodeId ? "is-selected" : ""}" data-node-id="${node.id}">
                    <div class="node-title">${node.title}</div>
                    <div class="node-meta">${node.slug} • ${node.type}</div>
                  </button>
                `,
              )
              .join("")}
          </div>
        </section>
      `,
    )
    .join("");

  elements.columns.querySelectorAll("[data-node-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedNodeId = button.dataset.nodeId;
      refresh();
    });
  });
}

function renderMetadata(node) {
  if (!node) {
    elements.inspectorTitle.textContent = "Select a node";
    elements.metadataForm.reset();
    return;
  }
  elements.inspectorTitle.textContent = node.title;
  elements.metadataForm.title.value = node.title;
  elements.metadataForm.slug.value = node.slug;
  elements.metadataForm.description.value = node.description || "";
}

function renderPreview(previewContext) {
  elements.preview.textContent = JSON.stringify(previewContext, null, 2);
}

async function refreshContentEditor() {
  const node = selectedNode();
  if (!node || node.type !== "content") {
    elements.contentEditor.value = "";
    elements.contentEditor.disabled = true;
    return;
  }
  const payload = await api(`/api/content?nodeId=${encodeURIComponent(node.id)}`);
  elements.contentEditor.disabled = false;
  elements.contentEditor.value = payload.content || "";
}

async function refresh() {
  const [sandboxPayload, columnsPayload] = await Promise.all([
    api("/api/sandbox"),
    state.selectedNodeId ? api(`/api/columns?selectedNodeId=${encodeURIComponent(state.selectedNodeId)}`) : Promise.resolve([]),
  ]);

  state.nodes = sandboxPayload.nodes;
  if (!state.selectedNodeId && state.nodes.length > 0) {
    state.selectedNodeId = sandboxPayload.sandbox.rootChildren[0] || state.nodes[0].id;
  }

  const columns = state.selectedNodeId
    ? await api(`/api/columns?selectedNodeId=${encodeURIComponent(state.selectedNodeId)}`)
    : columnsPayload;
  renderColumns(columns);

  const node = selectedNode();
  renderMetadata(node);
  await refreshContentEditor();

  if (node) {
    const preview = await api(`/api/preview?nodeId=${encodeURIComponent(node.id)}`);
    renderPreview(preview);
  } else {
    elements.preview.textContent = "Select a node to load preview context.";
  }
}

async function init() {
  const status = await api("/api/status");
  elements.status.textContent = `${status.appName} • ${status.sandboxPath.split("/").pop()}`;
  await refresh();
}

elements.metadataForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const node = selectedNode();
  if (!node || node.type === "root") {
    return;
  }
  await api(`/api/node?nodeId=${encodeURIComponent(node.id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: elements.metadataForm.title.value,
      slug: elements.metadataForm.slug.value,
      description: elements.metadataForm.description.value || null,
    }),
  });
  await refresh();
});

elements.contentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const node = selectedNode();
  if (!node || node.type !== "content") {
    return;
  }
  await api(`/api/content?nodeId=${encodeURIComponent(node.id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: elements.contentEditor.value }),
  });
  await refresh();
});

init().catch((error) => {
  elements.status.textContent = error.message;
  elements.preview.textContent = error.stack || error.message;
});
