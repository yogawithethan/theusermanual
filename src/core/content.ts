import { nodeContentPath, readTextFile, writeTextFile } from "./filesystem.js";
import { readNode } from "./nodes.js";

export async function readContent(sandboxPath: string, nodeId: string): Promise<string | null> {
  const node = await readNode(sandboxPath, nodeId);
  if (!node.contentFile) {
    return null;
  }
  return readTextFile(nodeContentPath(sandboxPath, node.id, node.contentFile));
}

export async function updateContent(sandboxPath: string, nodeId: string, content: string): Promise<void> {
  const node = await readNode(sandboxPath, nodeId);
  if (node.type !== "content" || !node.contentFile) {
    throw new Error(`Node "${nodeId}" does not support editable content`);
  }
  await writeTextFile(nodeContentPath(sandboxPath, node.id, node.contentFile), content);
}
