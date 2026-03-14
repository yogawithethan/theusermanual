import path from "node:path";

import { readJsonFile, resolveSandboxPath, writeJsonFile } from "./filesystem.js";
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
  const next: SceneConfig = {
    ...current,
    ...patch,
    background: {
      ...current.background,
      ...(patch.background ?? {}),
    },
    navigation: {
      ...current.navigation,
      ...(patch.navigation ?? {}),
    },
    nodeLayout: {
      ...current.nodeLayout,
      ...(patch.nodeLayout ?? {}),
    },
    preview: {
      ...current.preview,
      ...(patch.preview ?? {}),
    },
  };
  await writeJsonFile(scenePath(sandboxPath), next);
  return next;
}
