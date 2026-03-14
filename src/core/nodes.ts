import { rm } from "node:fs/promises";
import path from "node:path";

import {
  ensureDir,
  listNodeIds,
  nodeContentPath,
  nodeDir,
  nodeJsonPath,
  readJsonFile,
  readTextFile,
  resolveSandboxPath,
  writeJsonFile,
  writeTextFile,
} from "./filesystem.js";
import { readSandbox } from "./sandbox.js";
import type {
  CreateNodeInput,
  DuplicateNodeInput,
  MoveNodeInput,
  NodeMeta,
  NodeType,
  ReorderChildrenInput,
  RootNodeMeta,
  StoredNodeMeta,
  UpdateNodeInput,
} from "./types.js";
import {
  assertAllowedChildType,
  assertContentNodeRules,
  assertEditableNode,
  assertLeafDelete,
  assertNoCycles,
  assertNodeExists,
  assertParentExists,
  assertReorderMatchesChildren,
  assertUniqueSiblingSlug,
} from "./validation.js";

function nowIso(): string {
  return new Date().toISOString();
}

function isRootNode(node: StoredNodeMeta): node is RootNodeMeta {
  return node.type === "root";
}

function toParentType(node: StoredNodeMeta): "root" | NodeType {
  return isRootNode(node) ? "root" : node.type;
}

function insertAt<T>(items: T[], value: T, index?: number): T[] {
  if (index === undefined || index < 0 || index > items.length) {
    return [...items, value];
  }
  const next = [...items];
  next.splice(index, 0, value);
  return next;
}

function removeItem(items: string[], value: string): string[] {
  return items.filter((item) => item !== value);
}

function makeNodeId(type: NodeType, nodesById: Map<string, StoredNodeMeta>): string {
  let sequence = nodesById.size + 1;
  let candidate = `node-${type}-${String(sequence).padStart(3, "0")}`;
  while (nodesById.has(candidate)) {
    sequence += 1;
    candidate = `node-${type}-${String(sequence).padStart(3, "0")}`;
  }
  return candidate;
}

function makeCopyTitle(title: string): string {
  return title.endsWith(" Copy") ? title : `${title} Copy`;
}

function makeCopySlug(
  slug: string,
  parentId: string,
  nodesById: Map<string, StoredNodeMeta>,
  excludeNodeId?: string,
): string {
  let attempt = `${slug}-copy`;
  let suffix = 2;
  while (true) {
    try {
      assertUniqueSiblingSlug(nodesById.values(), parentId, attempt, excludeNodeId);
      return attempt;
    } catch {
      attempt = `${slug}-copy-${suffix}`;
      suffix += 1;
    }
  }
}

async function writeNodeMeta(sandboxPath: string, node: StoredNodeMeta): Promise<void> {
  assertContentNodeRules(node);
  await writeJsonFile(nodeJsonPath(sandboxPath, node.id), node);
}

async function updateStoredNode(
  sandboxPath: string,
  nodesById: Map<string, StoredNodeMeta>,
  node: StoredNodeMeta,
): Promise<void> {
  nodesById.set(node.id, node);
  await writeNodeMeta(sandboxPath, node);
}

export async function listNodes(sandboxPath: string): Promise<StoredNodeMeta[]> {
  const nodeIds = await listNodeIds(sandboxPath);
  const nodes = await Promise.all(
    nodeIds.map((nodeId) => readJsonFile<StoredNodeMeta>(nodeJsonPath(sandboxPath, nodeId))),
  );
  return nodes.sort((left, right) => left.id.localeCompare(right.id));
}

export async function readNodeIndex(sandboxPath: string): Promise<Map<string, StoredNodeMeta>> {
  const nodes = await listNodes(sandboxPath);
  return new Map(nodes.map((node) => [node.id, node]));
}

export async function readNode(sandboxPath: string, nodeId: string): Promise<StoredNodeMeta> {
  return readJsonFile<StoredNodeMeta>(nodeJsonPath(sandboxPath, nodeId));
}

export async function createNode(sandboxPath: string, input: CreateNodeInput): Promise<NodeMeta> {
  const config = await readSandbox(sandboxPath);
  const nodesById = await readNodeIndex(sandboxPath);
  const parent = assertParentExists(nodesById, input.parentId);
  assertAllowedChildType(config, toParentType(parent), input.type);

  const nodeId = input.id ?? makeNodeId(input.type, nodesById);
  if (nodesById.has(nodeId)) {
    throw new Error(`Node ID already exists: ${nodeId}`);
  }
  assertUniqueSiblingSlug(nodesById.values(), input.parentId, input.slug);

  const timestamp = nowIso();
  const node: NodeMeta = {
    id: nodeId,
    type: input.type,
    title: input.title,
    slug: input.slug,
    parentId: input.parentId,
    children: [],
    template: input.template ?? config.defaultTemplates[input.type],
    themeRef: input.themeRef ?? config.defaultTheme,
    sceneRef: input.sceneRef ?? config.defaultScene,
    icon: input.icon ?? null,
    description: input.description ?? null,
    contentFile: input.type === "content" ? input.contentFile ?? "content.md" : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const nextParent: StoredNodeMeta = {
    ...parent,
    children: insertAt(parent.children, node.id, input.index),
    updatedAt: timestamp,
  };

  await ensureDir(nodeDir(sandboxPath, node.id));
  await writeNodeMeta(sandboxPath, node);
  if (node.contentFile) {
    await writeTextFile(nodeContentPath(sandboxPath, node.id, node.contentFile), "");
  }
  await updateStoredNode(sandboxPath, nodesById, nextParent);
  return node;
}

export async function updateNode(
  sandboxPath: string,
  nodeId: string,
  patch: UpdateNodeInput,
): Promise<NodeMeta> {
  const nodesById = await readNodeIndex(sandboxPath);
  const node = assertNodeExists(nodesById, nodeId);
  assertEditableNode(node);

  const nextSlug = patch.slug ?? node.slug;
  assertUniqueSiblingSlug(nodesById.values(), node.parentId ?? "root", nextSlug, node.id);

  const nextNode: NodeMeta = {
    ...node,
    ...patch,
    slug: nextSlug,
    contentFile: node.type === "content" ? patch.contentFile ?? node.contentFile : null,
    updatedAt: nowIso(),
  };

  await updateStoredNode(sandboxPath, nodesById, nextNode);
  return nextNode;
}

export async function deleteNode(sandboxPath: string, nodeId: string): Promise<void> {
  const nodesById = await readNodeIndex(sandboxPath);
  const node = assertNodeExists(nodesById, nodeId);
  assertEditableNode(node);
  assertLeafDelete(node);

  const parent = node.parentId ? assertParentExists(nodesById, node.parentId) : null;
  if (parent) {
    const nextParent: StoredNodeMeta = {
      ...parent,
      children: removeItem(parent.children, node.id),
      updatedAt: nowIso(),
    };
    await updateStoredNode(sandboxPath, nodesById, nextParent);
  }

  await rm(nodeDir(sandboxPath, node.id), { recursive: true, force: false });
}

export async function moveNode(
  sandboxPath: string,
  nodeId: string,
  newParentIdOrInput: string | MoveNodeInput,
  index?: number,
): Promise<NodeMeta> {
  const input: MoveNodeInput =
    typeof newParentIdOrInput === "string"
      ? { nodeId, newParentId: newParentIdOrInput, index }
      : newParentIdOrInput;

  const config = await readSandbox(sandboxPath);
  const nodesById = await readNodeIndex(sandboxPath);
  const node = assertNodeExists(nodesById, input.nodeId);
  assertEditableNode(node);
  const oldParent = node.parentId ? assertParentExists(nodesById, node.parentId) : null;
  const newParent = assertParentExists(nodesById, input.newParentId);

  assertAllowedChildType(config, toParentType(newParent), node.type);
  assertNoCycles(nodesById, node.id, newParent.id);
  assertUniqueSiblingSlug(nodesById.values(), newParent.id, node.slug, node.id);

  const timestamp = nowIso();
  if (oldParent) {
    await updateStoredNode(sandboxPath, nodesById, {
      ...oldParent,
      children: removeItem(oldParent.children, node.id),
      updatedAt: timestamp,
    });
  }

  await updateStoredNode(sandboxPath, nodesById, {
    ...newParent,
    children: insertAt(removeItem(newParent.children, node.id), node.id, input.index),
    updatedAt: timestamp,
  });

  const nextNode: NodeMeta = {
    ...node,
    parentId: newParent.id,
    updatedAt: timestamp,
  };
  await updateStoredNode(sandboxPath, nodesById, nextNode);
  return nextNode;
}

export async function reorderChildren(
  sandboxPath: string,
  parentIdOrInput: string | ReorderChildrenInput,
  orderedChildIds?: string[],
): Promise<StoredNodeMeta> {
  const input: ReorderChildrenInput =
    typeof parentIdOrInput === "string"
      ? { parentId: parentIdOrInput, orderedChildIds: orderedChildIds ?? [] }
      : parentIdOrInput;

  const nodesById = await readNodeIndex(sandboxPath);
  const parent = assertParentExists(nodesById, input.parentId);
  assertReorderMatchesChildren(parent.children, input.orderedChildIds);

  const nextParent: StoredNodeMeta = {
    ...parent,
    children: [...input.orderedChildIds],
    updatedAt: nowIso(),
  };
  await updateStoredNode(sandboxPath, nodesById, nextParent);
  return nextParent;
}

async function cloneSubtree(
  sandboxPath: string,
  nodesById: Map<string, StoredNodeMeta>,
  sourceNodes: Map<string, StoredNodeMeta>,
  sourceNode: NodeMeta,
  parentId: string,
  index?: number,
): Promise<NodeMeta> {
  const slug = makeCopySlug(sourceNode.slug, parentId, nodesById);
  const copy = await createNode(sandboxPath, {
    type: sourceNode.type,
    title: makeCopyTitle(sourceNode.title),
    slug,
    parentId,
    index,
    template: sourceNode.template,
    themeRef: sourceNode.themeRef,
    sceneRef: sourceNode.sceneRef,
    icon: sourceNode.icon,
    description: sourceNode.description,
    contentFile: sourceNode.contentFile,
  });

  nodesById.set(copy.id, copy);

  if (sourceNode.contentFile) {
    const sourceContent = await readTextFile(nodeContentPath(sandboxPath, sourceNode.id, sourceNode.contentFile));
    await writeTextFile(nodeContentPath(sandboxPath, copy.id, copy.contentFile ?? "content.md"), sourceContent);
  }

  for (const childId of sourceNode.children) {
    const child = assertNodeExists(sourceNodes, childId);
    if (child.type === "root") {
      continue;
    }
    await cloneSubtree(sandboxPath, nodesById, sourceNodes, child, copy.id);
  }

  return copy;
}

export async function duplicateNode(
  sandboxPath: string,
  nodeIdOrInput: string | DuplicateNodeInput,
  targetParentId?: string,
  index?: number,
): Promise<NodeMeta> {
  const input: DuplicateNodeInput =
    typeof nodeIdOrInput === "string" ? { nodeId: nodeIdOrInput, targetParentId, index } : nodeIdOrInput;

  const sourceNodes = await readNodeIndex(sandboxPath);
  const source = assertNodeExists(sourceNodes, input.nodeId);
  assertEditableNode(source);
  const destinationParentId = input.targetParentId ?? source.parentId;
  if (!destinationParentId) {
    throw new Error(`Cannot duplicate node "${source.id}" without a destination parent`);
  }
  const liveNodes = await readNodeIndex(sandboxPath);
  return cloneSubtree(sandboxPath, liveNodes, sourceNodes, source, destinationParentId, input.index);
}

export async function listChildren(sandboxPath: string, parentId: string): Promise<NodeMeta[]> {
  const nodesById = await readNodeIndex(sandboxPath);
  const parent = assertParentExists(nodesById, parentId);
  return parent.children
    .map((childId) => assertNodeExists(nodesById, childId))
    .filter((child): child is NodeMeta => child.type !== "root");
}

export async function getAncestorChain(sandboxPath: string, nodeId: string): Promise<StoredNodeMeta[]> {
  const nodesById = await readNodeIndex(sandboxPath);
  const chain: StoredNodeMeta[] = [];
  let current: StoredNodeMeta | undefined = assertNodeExists(nodesById, nodeId);

  while (current) {
    chain.unshift(current);
    current = current.parentId ? nodesById.get(current.parentId) : undefined;
  }

  return chain;
}

export function getNodeDirectory(sandboxPath: string, nodeId: string): string {
  return path.join(resolveSandboxPath(sandboxPath), "nodes", nodeId);
}
