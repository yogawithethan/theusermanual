const state = {
  selectedNodeId: null,
  sandbox: null,
  nodes: [],
  theme: null,
  scene: null,
};

const elements = {
  status: document.querySelector("#status-pill"),
  columns: document.querySelector("#columns"),
  metadataForm: document.querySelector("#metadata-form"),
  inspectorTitle: document.querySelector("#inspector-title"),
  contentForm: document.querySelector("#content-form"),
  contentEditor: document.querySelector("#content-editor"),
  themeForm: document.querySelector("#theme-form"),
  themeEditor: document.querySelector("#theme-editor"),
  sceneForm: document.querySelector("#scene-form"),
  sceneEditor: document.querySelector("#scene-editor"),
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

function buildColumns() {
  if (!state.sandbox) {
    return [];
  }

  const nodesById = new Map(state.nodes.map((node) => [node.id, node]));
  const columns = [];
  let parentId = "root";
  let selectedId = state.selectedNodeId;

  while (true) {
    const childrenIds = parentId === "root" ? state.sandbox.rootChildren : nodesById.get(parentId)?.children || [];
    if (childrenIds.length === 0) {
      break;
    }

    const nodes = childrenIds.map((childId) => nodesById.get(childId)).filter(Boolean);
    const type = nodes[0]?.type;
    if (!type) {
      break;
    }

    columns.push({
      parentId,
      label: state.sandbox.layerLabels[type] || type,
      selectedNodeId: selectedId,
      nodes,
    });

    if (!selectedId) {
      break;
    }

    const selectedNode = nodesById.get(selectedId);
    if (!selectedNode || selectedNode.type === "content") {
      break;
    }

    parentId = selectedId;
    selectedId = selectedNode.children[0] || null;
  }

  return columns;
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

function renderConfigEditors() {
  elements.themeEditor.value = state.theme ? JSON.stringify(state.theme, null, 2) : "";
  elements.sceneEditor.value = state.scene ? JSON.stringify(state.scene, null, 2) : "";
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
  const sandboxPayload = await api("/api/sandbox");
  const [nodes, theme, scene] = await Promise.all([
    api("/api/nodes"),
    api("/api/theme"),
    api("/api/scene"),
  ]);

  state.sandbox = sandboxPayload.sandbox;
  state.nodes = nodes;
  state.theme = theme;
  state.scene = scene;

  if (!state.selectedNodeId && state.nodes.length > 0) {
    state.selectedNodeId = state.sandbox.rootChildren[0] || state.nodes[0].id;
  }

  renderColumns(buildColumns());

  const node = selectedNode();
  renderMetadata(node);
  renderConfigEditors();
  await refreshContentEditor();
}

async function init() {
  const sandboxPayload = await api("/api/sandbox");
  elements.status.textContent = `${sandboxPayload.appName} • ${sandboxPayload.sandboxPath.split("/").pop()}`;
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

elements.themeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/theme", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: elements.themeEditor.value,
  });
  await refresh();
});

elements.sceneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await api("/api/scene", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: elements.sceneEditor.value,
  });
  await refresh();
});

init().catch((error) => {
  elements.status.textContent = error.message;
  elements.themeEditor.value = error.stack || error.message;
});
