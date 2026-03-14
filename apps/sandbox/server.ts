import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildEditorColumns,
  buildPreviewContext,
  createNode,
  deleteNode,
  duplicateNode,
  getNodeActionAvailability,
  listNodes,
  readSandbox,
  readScene,
  readTheme,
  updateContent,
  updateNode,
  updateScene,
  updateTheme,
} from "../../src/core/index.js";
import type { PreviewDevice } from "../../src/core/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const sandboxPath = path.resolve(process.env.SANDBOX_PATH ?? path.join(repoRoot, "sandboxes/example-sandbox"));
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
  const statusCode = error instanceof Error ? 400 : 500;
  sendJson(response, statusCode, { error: message });
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function requireParam(url: URL, key: string): string {
  const value = url.searchParams.get(key);
  if (!value) {
    throw new Error(`Missing required query parameter: ${key}`);
  }
  return value;
}

function normalizeDevice(value: string | null): PreviewDevice | undefined {
  if (value === "desktop" || value === "tablet" || value === "mobile") {
    return value;
  }
  return undefined;
}

async function resolveSelectedNodeId(requestedNodeId?: string | null): Promise<string> {
  const sandbox = await readSandbox(sandboxPath);
  const nodes = await listNodes(sandboxPath);
  const knownIds = new Set([sandbox.rootNodeId, ...nodes.map((node) => node.id)]);

  if (requestedNodeId && knownIds.has(requestedNodeId)) {
    return requestedNodeId;
  }

  return sandbox.rootChildren[0] ?? sandbox.rootNodeId;
}

async function readEditorState(requestUrl: URL): Promise<unknown> {
  const selectedNodeId = await resolveSelectedNodeId(requestUrl.searchParams.get("selectedNodeId"));
  const device = normalizeDevice(requestUrl.searchParams.get("device"));

  const [sandbox, nodes, theme, scene, columns, actions, preview] = await Promise.all([
    readSandbox(sandboxPath),
    listNodes(sandboxPath),
    readTheme(sandboxPath),
    readScene(sandboxPath),
    buildEditorColumns(sandboxPath, selectedNodeId),
    getNodeActionAvailability(sandboxPath, selectedNodeId),
    buildPreviewContext(sandboxPath, selectedNodeId, device),
  ]);

  return {
    appName: "Islands • Sandbox",
    sandboxPath,
    selectedNodeId,
    sandbox,
    nodes,
    theme,
    scene,
    columns,
    actions,
    preview,
    content: preview.content,
  };
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

    if (method === "GET" && url.pathname === "/api/editor-state") {
      sendJson(response, 200, await readEditorState(url));
      return;
    }

    if (method === "POST" && url.pathname === "/api/node") {
      sendJson(response, 200, await createNode(sandboxPath, (await readBody(request)) as never));
      return;
    }

    if (method === "PATCH" && url.pathname === "/api/node") {
      const nodeId = requireParam(url, "nodeId");
      sendJson(response, 200, await updateNode(sandboxPath, nodeId, (await readBody(request)) as never));
      return;
    }

    if (method === "DELETE" && url.pathname === "/api/node") {
      const nodeId = requireParam(url, "nodeId");
      await deleteNode(sandboxPath, nodeId);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (method === "POST" && url.pathname === "/api/node/duplicate") {
      const nodeId = requireParam(url, "nodeId");
      sendJson(response, 200, await duplicateNode(sandboxPath, nodeId));
      return;
    }

    if (method === "PUT" && url.pathname === "/api/content") {
      const nodeId = requireParam(url, "nodeId");
      const body = (await readBody(request)) as { content?: string };
      await updateContent(sandboxPath, nodeId, body.content ?? "");
      sendJson(response, 200, { ok: true });
      return;
    }

    if (method === "PATCH" && url.pathname === "/api/theme") {
      sendJson(response, 200, await updateTheme(sandboxPath, (await readBody(request)) as never));
      return;
    }

    if (method === "PATCH" && url.pathname === "/api/scene") {
      sendJson(response, 200, await updateScene(sandboxPath, (await readBody(request)) as never));
      return;
    }

    sendJson(response, 404, { error: `Not found: ${method} ${url.pathname}` });
  } catch (error) {
    sendError(response, error);
  }
});

server.listen(port, host, () => {
  console.log(`Islands • Sandbox running at http://${host}:${port}`);
  console.log(`Editing sandbox: ${sandboxPath}`);
});
