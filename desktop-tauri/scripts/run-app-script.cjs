const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const appDir = path.resolve(__dirname, "..", "..", "app");
const viteBin = path.join(appDir, "node_modules", "vite", "bin", "vite.js");
const tscBin = path.join(appDir, "node_modules", "typescript", "bin", "tsc");
const scriptArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const [mode, ...extraArgs] = scriptArgs;

if (!mode) {
  console.error("Usage: node ./scripts/run-app-script.cjs <dev|build> [args]");
  process.exit(1);
}

function runNodeSync(entry, args) {
  const child = spawnSync(process.execPath, [entry, ...args], {
    cwd: appDir,
    stdio: "inherit",
    env: process.env,
  });

  if (child.error) {
    console.error(child.error);
    process.exit(1);
  }

  return child.status ?? 1;
}

if (mode === "build") {
  const tscStatus = runNodeSync(tscBin, ["-b"]);
  if (tscStatus !== 0) {
    process.exit(tscStatus);
  }

  const viteStatus = runNodeSync(viteBin, ["build", ...extraArgs]);
  process.exit(viteStatus);
}

if (mode === "dev") {
  const child = spawn(process.execPath, [viteBin, ...extraArgs], {
    cwd: appDir,
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  for (const signal of ["SIGINT", "SIGTERM", "SIGBREAK"]) {
    process.on(signal, () => {
      child.kill(signal);
    });
  }

  return;
}

console.error(`Unsupported mode: ${mode}`);
process.exit(1);
