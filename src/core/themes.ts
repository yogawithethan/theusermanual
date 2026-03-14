import path from "node:path";

import { mergePlainObjects, readJsonFile, resolveSandboxPath, writeJsonFile } from "./filesystem.js";
import type { ThemeConfig, UpdateThemeInput } from "./types.js";

function themePath(sandboxPath: string): string {
  return path.join(resolveSandboxPath(sandboxPath), "theme.json");
}

export async function readTheme(sandboxPath: string, _themeId?: string): Promise<ThemeConfig> {
  return readJsonFile<ThemeConfig>(themePath(sandboxPath));
}

export async function updateTheme(
  sandboxPath: string,
  patch: UpdateThemeInput,
  _themeId?: string,
): Promise<ThemeConfig> {
  const current = await readTheme(sandboxPath);
  const next = mergePlainObjects(current, patch);
  await writeJsonFile(themePath(sandboxPath), next);
  return next;
}
