import { access, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export function resolveSandboxPath(sandboxPath: string): string {
  return path.resolve(sandboxPath);
}

export function nodeDir(sandboxPath: string, nodeId: string): string {
  return path.join(resolveSandboxPath(sandboxPath), "nodes", nodeId);
}

export function nodeJsonPath(sandboxPath: string, nodeId: string): string {
  return path.join(nodeDir(sandboxPath, nodeId), "node.json");
}

export function nodeContentPath(sandboxPath: string, nodeId: string, contentFile: string): string {
  if (path.isAbsolute(contentFile) || contentFile.includes("..")) {
    throw new Error(`Invalid content file path: ${contentFile}`);
  }
  return path.join(resolveSandboxPath(sandboxPath), "content", contentFile);
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath: string): Promise<void> {
  await mkdir(targetPath, { recursive: true });
}

export async function readJsonFile<T>(targetPath: string): Promise<T> {
  const raw = await readFile(targetPath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(targetPath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readTextFile(targetPath: string): Promise<string> {
  return readFile(targetPath, "utf8");
}

export async function writeTextFile(targetPath: string, value: string): Promise<void> {
  await ensureDir(path.dirname(targetPath));
  await writeFile(targetPath, value, "utf8");
}

export async function removePath(targetPath: string): Promise<void> {
  await rm(targetPath, { recursive: true, force: false });
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  await ensureDir(path.dirname(newPath));
  await rename(oldPath, newPath);
}

export async function listNodeIds(sandboxPath: string): Promise<string[]> {
  const nodesPath = path.join(resolveSandboxPath(sandboxPath), "nodes");
  const entries = await readdir(nodesPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergePlainObjects<T>(base: T, patch: Partial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch as T) ?? base;
  }

  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue;
    }
    const current = next[key];
    next[key] = isPlainObject(current) && isPlainObject(value) ? mergePlainObjects(current, value) : value;
  }
  return next as T;
}
