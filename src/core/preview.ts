import { readContent } from "./content.js";
import { readSandbox, getAllowedChildTypes, getLayerLabel } from "./sandbox.js";
import { getAncestorChain, listChildren, readNode, readNodeIndex } from "./nodes.js";
import { readScene } from "./scenes.js";
import { readTheme } from "./themes.js";
import type {
  EditorColumnView,
  NodeActionAvailability,
  NodeMeta,
  NodeType,
  PreviewContext,
  PreviewDevice,
  StoredNodeMeta,
} from "./types.js";

function sceneDeviceToPreviewDevice(deviceFrame: string): PreviewDevice {
  if (deviceFrame.includes("mobile") || deviceFrame.includes("phone")) {
    return "mobile";
  }
  if (deviceFrame.includes("tablet")) {
    return "tablet";
  }
  return "desktop";
}

export async function getNodeActionAvailability(
  sandboxPath: string,
  nodeId: string,
): Promise<NodeActionAvailability> {
  const [config, node] = await Promise.all([readSandbox(sandboxPath), readNode(sandboxPath, nodeId)]);
  const parentType = node.type === "root" ? "root" : node.type;
  const allowedChildTypes = parentType === "content" ? [] : getAllowedChildTypes(config, parentType);

  return {
    nodeId,
    canEdit: node.type !== "root",
    canDelete: node.type !== "root" && node.children.length === 0,
    canDuplicate: node.type !== "root",
    canPreview: node.type === "content",
    canCreateChildren: allowedChildTypes.length > 0,
    allowedChildTypes,
  };
}

export async function buildEditorColumns(
  sandboxPath: string,
  selectedNodeId: string,
): Promise<EditorColumnView[]> {
  const [config, nodesById, chain] = await Promise.all([
    readSandbox(sandboxPath),
    readNodeIndex(sandboxPath),
    getAncestorChain(sandboxPath, selectedNodeId),
  ]);

  const columns: EditorColumnView[] = [];

  for (let index = 0; index < chain.length; index += 1) {
    const parent = chain[index];
    const selectedChild = chain[index + 1] ?? null;
    if (parent.type === "content") {
      break;
    }

    const children = parent.children
      .map((childId) => nodesById.get(childId))
      .filter((child): child is NodeMeta => Boolean(child && child.type !== "root"));

    if (children.length === 0) {
      continue;
    }

    const parentType = parent.type === "root" ? "root" : parent.type;
    const inferredType = children[0]?.type ?? (config.allowedChildTypes[parentType] as NodeType[])[0];
    columns.push({
      parentId: parent.id,
      label: getLayerLabel(config, inferredType),
      selectedNodeId: selectedChild?.id ?? null,
      nodes: children,
    });
  }

  return columns;
}

export async function buildPreviewContext(
  sandboxPath: string,
  nodeId: string,
  device?: PreviewDevice,
): Promise<PreviewContext> {
  const node = await readNode(sandboxPath, nodeId);
  const [theme, scene, ancestorChain] = await Promise.all([
    readTheme(sandboxPath, node.themeRef),
    readScene(sandboxPath, node.sceneRef),
    getAncestorChain(sandboxPath, nodeId),
  ]);

  return {
    node,
    ancestorChain,
    theme,
    scene,
    device: device ?? sceneDeviceToPreviewDevice(scene.preview.deviceFrame),
    content: node.type === "content" ? await readContent(sandboxPath, node.id) : null,
  };
}

export async function listSelectedNodeChildren(
  sandboxPath: string,
  nodeId: string,
): Promise<StoredNodeMeta[]> {
  return listChildren(sandboxPath, nodeId);
}
