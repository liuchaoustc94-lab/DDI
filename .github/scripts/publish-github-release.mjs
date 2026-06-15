import fs from "node:fs";
import path from "node:path";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;
const releaseName = process.env.RELEASE_NAME || tag;
const assetDir = process.env.RELEASE_ASSET_DIR;
const prerelease = String(process.env.RELEASE_PRERELEASE || "").toLowerCase() === "true";
const outputFile = process.env.GITHUB_OUTPUT;

if (!token) {
  throw new Error("Missing GITHUB_TOKEN.");
}

if (!repository || !repository.includes("/")) {
  throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository ?? "<empty>"}`);
}

if (!tag) {
  throw new Error("Missing release tag.");
}

if (!assetDir || !fs.existsSync(assetDir)) {
  throw new Error(`Release asset directory not found: ${assetDir ?? "<empty>"}`);
}

const [owner, repo] = repository.split("/", 2);
const assetFiles = fs
  .readdirSync(assetDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => path.join(assetDir, entry.name))
  .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

if (assetFiles.length === 0) {
  throw new Error(`No release assets found in ${assetDir}`);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".exe":
      return "application/vnd.microsoft.portable-executable";
    case ".msi":
      return "application/x-msi";
    case ".zip":
      return "application/zip";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".appx":
      return "application/vnd.ms-appx";
    case ".msix":
      return "application/vnd.ms-appx";
    default:
      return "application/octet-stream";
  }
}

async function githubRequest(url, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/vnd.github+json");
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-GitHub-Api-Version", "2022-11-28");

  const response = await fetch(url, { ...init, headers });
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  if (response.status === 404) {
    return null;
  }

  const errorText = await response.text();
  throw new Error(`GitHub API ${response.status} ${response.statusText}: ${errorText}`);
}

async function getReleaseByTag() {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`);
}

async function createDraftRelease() {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/releases`, {
    method: "POST",
    body: JSON.stringify({
      tag_name: tag,
      name: releaseName,
      draft: true,
      prerelease,
      generate_release_notes: true,
    }),
  });
}

async function updateRelease(releaseId, body) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

async function deleteAsset(assetId) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}`, {
    method: "DELETE",
  });
}

async function uploadAsset(uploadUrlTemplate, filePath) {
  const uploadBaseUrl = uploadUrlTemplate.replace(/\{.*$/, "");
  const uploadUrl = new URL(uploadBaseUrl);
  uploadUrl.searchParams.set("name", path.basename(filePath));

  const body = fs.readFileSync(filePath);
  const headers = new Headers();
  headers.set("Accept", "application/vnd.github+json");
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-GitHub-Api-Version", "2022-11-28");
  headers.set("Content-Type", getContentType(filePath));
  headers.set("Content-Length", String(body.byteLength));

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Release asset upload failed for ${path.basename(filePath)}: ${response.status} ${response.statusText} ${errorText}`);
  }

  return response.json();
}

let release = await getReleaseByTag();
const createdRelease = !release;

if (!release) {
  release = await createDraftRelease();
}

for (const asset of release.assets || []) {
  if (assetFiles.some((filePath) => path.basename(filePath) === asset.name)) {
    await deleteAsset(asset.id);
  }
}

const uploadedAssets = [];
for (const filePath of assetFiles) {
  const asset = await uploadAsset(release.upload_url, filePath);
  uploadedAssets.push({
    name: asset.name,
    downloadUrl: asset.browser_download_url,
  });
}

const finalRelease = await updateRelease(release.id, {
  name: releaseName,
  draft: false,
  prerelease,
});

if (outputFile) {
  fs.appendFileSync(outputFile, `release_id=${finalRelease.id}\n`, "utf8");
  fs.appendFileSync(outputFile, `release_url=${finalRelease.html_url}\n`, "utf8");
}

process.stdout.write(
  JSON.stringify(
    {
      createdRelease,
      releaseId: finalRelease.id,
      releaseUrl: finalRelease.html_url,
      uploadedAssets,
    },
    null,
    2,
  ),
);
