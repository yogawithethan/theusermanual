import path from "node:path";

import { readJsonFile, resolveSandboxPath, writeJsonFile } from "./filesystem.js";
import type { NodeType, ParentType, SandboxConfig, UpdateSandboxConfigInput } from "./types.js";

function sandboxConfigPath(sandboxPath: string): string {
  return path.join(resolveSandboxPath(sandboxPath), "sandbox.json");
}

export async function readSandbox(sandboxPath: string): Promise<SandboxConfig> {
  return readJsonFile<SandboxConfig>(sandboxConfigPath(sandboxPath));
}

export async function updateSandboxConfig(
  sandboxPath: string,
  patch: UpdateSandboxConfigInput,
): Promise<SandboxConfig> {
  const current = await readSandbox(sandboxPath);
  const next: SandboxConfig = {
    ...current,
    ...patch,
    rootChildren: patch.rootChildren ?? current.rootChildren,
    layerLabels: {
      ...current.layerLabels,
      ...(patch.layerLabels ?? {}),
    },
    allowedChildTypes: {
      ...current.allowedChildTypes,
      ...(patch.allowedChildTypes ?? {}),
    },
    defaultTemplates: {
      ...current.defaultTemplates,
      ...(patch.defaultTemplates ?? {}),
    },
  };
  await writeJsonFile(sandboxConfigPath(sandboxPath), next);
  return next;
}

export async function replaceRootChildren(sandboxPath: string, rootChildren: string[]): Promise<SandboxConfig> {
  const current = await readSandbox(sandboxPath);
  const next: SandboxConfig = {
    ...current,
    rootChildren: [...rootChildren],
  };
  await writeJsonFile(sandboxConfigPath(sandboxPath), next);
  return next;
}

export function getLayerLabel(config: SandboxConfig, type: NodeType): string {
  return config.layerLabels[type];
}

export function getVisibleLayerName(config: SandboxConfig, type: NodeType): string {
  return getLayerLabel(config, type);
}

export function getAllowedChildTypes(config: SandboxConfig, parentType: ParentType): NodeType[] {
  return [...(config.allowedChildTypes[parentType] ?? [])];
}
