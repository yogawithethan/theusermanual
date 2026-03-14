import path from "node:path";

import { readJsonFile, resolveSandboxPath, writeJsonFile } from "./filesystem.js";
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
  const next: ThemeConfig = {
    ...current,
    ...patch,
    fonts: {
      ...current.fonts,
      ...(patch.fonts ?? {}),
    },
    colors: {
      ...current.colors,
      ...(patch.colors ?? {}),
    },
    card: {
      ...current.card,
      ...(patch.card ?? {}),
      shadow: {
        ...current.card.shadow,
        ...(patch.card?.shadow ?? {}),
      },
    },
    effects: {
      ...current.effects,
      ...(patch.effects ?? {}),
    },
  };
  await writeJsonFile(themePath(sandboxPath), next);
  return next;
}
