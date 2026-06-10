const fs = require("node:fs");
const path = require("node:path");

const configPath = path.resolve(__dirname, "..", "src-tauri", "tauri.conf.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

const productName = config.productName || "desktop-app";
const version = config.version || "0.0.0";
const productSlug = slugify(productName);

process.stdout.write(
  JSON.stringify(
    {
      productName,
      productSlug,
      version,
      artifactBase: `${productSlug}-windows-v${version}`,
    },
    null,
    2,
  ),
);
