import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  listNodes,
  readContent,
  readNode,
  readSandbox,
  readScene,
  readTheme,
  updateContent,
  updateNode,
  updateScene,
  updateTheme,
} from "../../src/core/index.js";

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
  sendJson(response, 500, { error: message });
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

    if (method === "GET" && url.pathname === "/api/sandbox") {
      sendJson(response, 200, {
        appName: "Islands • Sandbox",
        sandboxPath,
        sandbox: await readSandbox(sandboxPath),
      });
      return;
    }

    if (method === "GET" && url.pathname === "/api/nodes") {
      sendJson(response, 200, await listNodes(sandboxPath));
      return;
    }

    if (method === "GET" && url.pathname === "/api/theme") {
      sendJson(response, 200, await readTheme(sandboxPath));
      return;
    }

    if (method === "GET" && url.pathname === "/api/scene") {
      sendJson(response, 200, await readScene(sandboxPath));
      return;
    }

    if (method === "GET" && url.pathname === "/api/content") {
      const nodeId = requireParam(url, "nodeId");
      sendJson(response, 200, { nodeId, content: await readContent(sandboxPath, nodeId) });
      return;
    }

    if (method === "GET" && url.pathname === "/api/node") {
      const nodeId = requireParam(url, "nodeId");
      sendJson(response, 200, await readNode(sandboxPath, nodeId));
      return;
    }

    if (method === "PATCH" && url.pathname === "/api/node") {
      const nodeId = requireParam(url, "nodeId");
      sendJson(response, 200, await updateNode(sandboxPath, nodeId, (await readBody(request)) as never));
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
