const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node ./scripts/run-tauri-cli.cjs <tauri-args...>");
  process.exit(1);
}

async function main() {
  const tauri = require("@tauri-apps/cli");
  await tauri.run(args, "tauri");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
