import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import process from "node:process";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3002");
const rootDir = process.cwd();
const distDir = resolve(rootDir, "dist");
const indexPath = join(distDir, "index.html");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT: ${process.env.PORT ?? ""}`);
}

if (!existsSync(indexPath)) {
  throw new Error(`Missing build output: ${indexPath}`);
}

function getSafeFilePath(rawUrl) {
  const pathname = decodeURIComponent((rawUrl ?? "/").split("?")[0]);
  const normalized = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const relative = normalized.replace(/^[/\\]+/, "");
  const candidate = join(distDir, relative);

  if (!candidate.startsWith(distDir)) {
    return indexPath;
  }

  return candidate;
}

async function resolveFilePath(requestUrl) {
  let candidate = getSafeFilePath(requestUrl);

  try {
    const fileStat = await stat(candidate);
    if (fileStat.isDirectory()) {
      candidate = join(candidate, "index.html");
    }
    await stat(candidate);
    return candidate;
  } catch {
    const extension = extname(candidate);
    if (extension) {
      throw new Error("NOT_FOUND");
    }
    return indexPath;
  }
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
}

const server = createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  try {
    const filePath = await resolveFilePath(req.url ?? "/");
    const extension = extname(filePath).toLowerCase();
    const contentType = mimeTypes[extension] ?? "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });

    if (req.method === "HEAD") {
      res.end();
      return;
    }

    createReadStream(filePath).pipe(res);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      sendNotFound(res);
      return;
    }

    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`DDI website is serving ${distDir} on http://${host}:${port}`);
});
