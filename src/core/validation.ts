import type { NodeMeta, NodeType, ParentType, SandboxConfig, StoredNodeMeta } from "./types.js";

const NODE_TYPES: NodeType[] = ["layer1", "layer2", "layer3", "layer4", "content"];

export function isNodeType(value: string): value is NodeType {
  return NODE_TYPES.includes(value as NodeType);
}

export function assertValidNodeType(value: string): asserts value is NodeType {
  if (!isNodeType(value)) {
    throw new Error(`Invalid node type: ${value}`);
  }
}

export function assertAllowedChildType(
  config: SandboxConfig,
  parentType: ParentType,
  childType: NodeType,
): void {
  const allowedTypes = config.allowedChildTypes[parentType] ?? [];
  if (!allowedTypes.includes(childType)) {
    throw new Error(`Node type "${childType}" is not allowed under "${parentType}"`);
  }
}

export function assertUniqueSiblingSlug(
  nodes: Iterable<StoredNodeMeta>,
  parentId: string,
  slug: string,
  excludeNodeId?: string,
): void {
  for (const node of nodes) {
    if (node.type === "root") {
      continue;
    }
    if (node.parentId === parentId && node.slug === slug && node.id !== excludeNodeId) {
      throw new Error(`Sibling slug "${slug}" already exists under parent "${parentId}"`);
    }
  }
}

export function assertNodeExists(nodesById: Map<string, StoredNodeMeta>, nodeId: string): StoredNodeMeta {
  const node = nodesById.get(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  return node;
}

export function assertParentExists(nodesById: Map<string, StoredNodeMeta>, parentId: string): StoredNodeMeta {
  const parent = nodesById.get(parentId);
  if (!parent) {
    throw new Error(`Parent node not found: ${parentId}`);
  }
  return parent;
}

export function assertLeafDelete(node: StoredNodeMeta): void {
  if (node.children.length > 0) {
    throw new Error(`Cannot delete non-leaf node "${node.id}"`);
  }
}

export function assertReorderMatchesChildren(existingChildren: string[], nextChildren: string[]): void {
  if (existingChildren.length !== nextChildren.length) {
    throw new Error("Reordered children must match existing children exactly");
  }
  const existing = [...existingChildren].sort();
  const next = [...nextChildren].sort();
  for (let index = 0; index < existing.length; index += 1) {
    if (existing[index] !== next[index]) {
      throw new Error("Reordered children must contain the exact existing child IDs");
    }
  }
}

export function assertContentNodeRules(node: StoredNodeMeta): void {
  if (node.type === "root") {
    if (node.contentFile !== null) {
      throw new Error("Root node cannot define a content file");
    }
    return;
  }
  if (node.type === "content") {
    if (!node.contentFile) {
      throw new Error(`Content node "${node.id}" must define a content file`);
    }
    if (node.children.length > 0) {
      throw new Error(`Content node "${node.id}" cannot have children`);
    }
    return;
  }
  if (node.contentFile !== null) {
    throw new Error(`Only content nodes can define a content file: ${node.id}`);
  }
}

export function assertNoCycles(
  nodesById: Map<string, StoredNodeMeta>,
  nodeId: string,
  newParentId: string,
): void {
  let currentId: string | null = newParentId;
  while (currentId) {
    if (currentId === nodeId) {
      throw new Error(`Move would create a cycle for node "${nodeId}"`);
    }
    const current = nodesById.get(currentId);
    currentId = current?.parentId ?? null;
  }
}

export function assertEditableNode(node: StoredNodeMeta): asserts node is NodeMeta {
  if (node.type === "root") {
    throw new Error("Root node cannot be edited through node CRUD operations");
  }
}
