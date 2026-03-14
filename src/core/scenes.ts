import path from "node:path";

import { mergePlainObjects, readJsonFile, resolveSandboxPath, writeJsonFile } from "./filesystem.js";
import type { SceneConfig, UpdateSceneInput } from "./types.js";

function scenePath(sandboxPath: string): string {
  return path.join(resolveSandboxPath(sandboxPath), "scene.json");
}

export async function readScene(sandboxPath: string, _sceneId?: string): Promise<SceneConfig> {
  return readJsonFile<SceneConfig>(scenePath(sandboxPath));
}

export async function updateScene(
  sandboxPath: string,
  patch: UpdateSceneInput,
  _sceneId?: string,
): Promise<SceneConfig> {
  const current = await readScene(sandboxPath);
  const next = mergePlainObjects(current, patch);
  await writeJsonFile(scenePath(sandboxPath), next);
  return next;
}
