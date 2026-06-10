const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const releaseDir = path.join(rootDir, "src-tauri", "target", "release");
const bundleDir = path.join(releaseDir, "bundle");
const metadataPath = path.join(rootDir, ".artifact-meta.json");
const stagingRoot = path.join(rootDir, ".artifacts");

if (!fs.existsSync(metadataPath)) {
  throw new Error(`Missing build metadata file: ${metadataPath}`);
}

if (!fs.existsSync(bundleDir)) {
  throw new Error(`Missing Tauri bundle directory: ${bundleDir}`);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8").replace(/^\uFEFF/, ""));
const bundleArtifactDir = path.join(stagingRoot, `${metadata.artifactBase}-bundle`);
const installersArtifactDir = path.join(stagingRoot, `${metadata.artifactBase}-installers`);

fs.rmSync(stagingRoot, { recursive: true, force: true });
fs.mkdirSync(bundleArtifactDir, { recursive: true });
fs.mkdirSync(installersArtifactDir, { recursive: true });

function copyRecursive(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

copyRecursive(bundleDir, bundleArtifactDir);

const installerExtensions = new Set([".exe", ".msi", ".zip", ".msix", ".appx"]);
const installerFiles = [];

function collectInstallers(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectInstallers(fullPath);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (installerExtensions.has(ext)) {
      installerFiles.push(fullPath);
    }
  }
}

collectInstallers(bundleDir);

const checksums = [];

for (const installerPath of installerFiles) {
  const targetPath = path.join(installersArtifactDir, path.basename(installerPath));
  fs.copyFileSync(installerPath, targetPath);
}

const crypto = require("node:crypto");
for (const entry of fs.readdirSync(installersArtifactDir)) {
  const fullPath = path.join(installersArtifactDir, entry);
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) {
    continue;
  }

  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(fullPath));
  checksums.push(`${hash.digest("hex")}  ${entry}`);
}

fs.writeFileSync(
  path.join(installersArtifactDir, "SHA256SUMS.txt"),
  `${checksums.sort().join("\n")}\n`,
  "utf8",
);

process.stdout.write(
  JSON.stringify(
    {
      bundleArtifactDir,
      installersArtifactDir,
      installerCount: installerFiles.length,
    },
    null,
    2,
  ),
);
