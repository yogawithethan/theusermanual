import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pathExists, readJsonFile, writeJsonFile } from "../../src/core/filesystem.js";

interface EditableCardStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  radius: number;
  titleColor: string;
  descriptionColor: string;
  titleSize: number;
}

interface EditableCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  style: EditableCardStyle;
  updatedAt: string;
}

const DEFAULT_CARD: EditableCard = {
  id: "card-001",
  title: "Breathe Deeper",
  description: "A calm place to begin. Shape the card visually, keep the file underneath, and stay completely out of JSON.",
  icon: "sparkles",
  style: {
    backgroundColor: "#F4EDE2",
    borderColor: "#1D1D1D",
    borderWidth: 2,
    radius: 30,
    titleColor: "#171717",
    descriptionColor: "#5E5A56",
    titleSize: 46,
  },
  updatedAt: "2026-03-14T00:00:00.000Z",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const cardPath = path.resolve(process.env.CARD_PATH ?? path.join(repoRoot, "sandboxes/simple-card/card.json"));
const port = Number(process.env.PORT ?? 4321);
const host = "127.0.0.1";

const staticFiles = new Map<string, { file: string; contentType: string }>([
  ["/", { file: path.join(__dirname, "index.html"), contentType: "text/html; charset=utf-8" }],
  ["/styles.css", { file: path.join(__dirname, "styles.css"), contentType: "text/css; charset=utf-8" }],
  ["/app.js", { file: path.join(__dirname, "app.js"), contentType: "application/javascript; charset=utf-8" }],
]);

function sendJson(response: ServerResponse<IncomingMessage>, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(payload)}\n`);
}

function sendError(response: ServerResponse<IncomingMessage>, error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  sendJson(response, 400, { error: message });
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sanitizeColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : fallback;
}

function sanitizeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const next = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(next)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, next));
}

function sanitizeText(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function sanitizeIcon(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "sparkles";
}

function normalizeCard(input: Partial<EditableCard>, current: EditableCard): EditableCard {
  return {
    id: current.id,
    title: sanitizeText(input.title, current.title) || current.title,
    description: sanitizeText(input.description, current.description),
    icon: sanitizeIcon(input.icon),
    style: {
      backgroundColor: sanitizeColor(input.style?.backgroundColor, current.style.backgroundColor),
      borderColor: sanitizeColor(input.style?.borderColor, current.style.borderColor),
      borderWidth: sanitizeNumber(input.style?.borderWidth, current.style.borderWidth, 0, 12),
      radius: sanitizeNumber(input.style?.radius, current.style.radius, 0, 80),
      titleColor: sanitizeColor(input.style?.titleColor, current.style.titleColor),
      descriptionColor: sanitizeColor(input.style?.descriptionColor, current.style.descriptionColor),
      titleSize: sanitizeNumber(input.style?.titleSize, current.style.titleSize, 20, 72),
    },
    updatedAt: new Date().toISOString(),
  };
}

async function ensureCardFile(): Promise<void> {
  if (!(await pathExists(cardPath))) {
    await writeJsonFile(cardPath, DEFAULT_CARD);
  }
}

async function readCard(): Promise<EditableCard> {
  await ensureCardFile();
  return readJsonFile<EditableCard>(cardPath);
}

async function saveCard(input: Partial<EditableCard>): Promise<EditableCard> {
  const current = await readCard();
  const next = normalizeCard(input, current);
  await writeJsonFile(cardPath, next);
  return next;
}

const server = createServer(async (request, response) => {
  try {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    const staticFile = method === "GET" ? staticFiles.get(url.pathname) : undefined;
    if (staticFile) {
      const file = await readFile(staticFile.file);
      response.writeHead(200, { "content-type": staticFile.contentType });
      response.end(file);
      return;
    }

    if (method === "GET" && url.pathname === "/api/card") {
      sendJson(response, 200, {
        appName: "Islands • Sandbox",
        cardPath,
        card: await readCard(),
      });
      return;
    }

    if (method === "PUT" && url.pathname === "/api/card") {
      sendJson(response, 200, {
        appName: "Islands • Sandbox",
        cardPath,
        card: await saveCard((await readBody(request)) as Partial<EditableCard>),
      });
      return;
    }

    sendJson(response, 404, { error: `Not found: ${method} ${url.pathname}` });
  } catch (error) {
    sendError(response, error);
  }
});

server.listen(port, host, async () => {
  await ensureCardFile();
  console.log(`Islands • Sandbox running at http://${host}:${port}`);
  console.log(`Editing card: ${cardPath}`);
});
