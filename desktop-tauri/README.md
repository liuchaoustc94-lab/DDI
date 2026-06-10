# DDI Desktop Shell

This directory contains an isolated Tauri desktop wrapper for the existing web app in [../app](../app).

It does **not** replace or modify the current browser version:

- the current web app still runs from `../app`
- this wrapper only references `../app` through Tauri hook commands
- `../app/package.json` and its existing scripts remain unchanged

## Layout

- `package.json`: Tauri CLI for the desktop wrapper only
- `src-tauri/`: Rust shell, Tauri config, and desktop bundle assets
- `../app`: existing Vite + React frontend

## Commands

From this directory:

```powershell
npm install
npm run tauri:info
npm run dev
npm run build
```

If `npm` is not on `PATH`, you can use the bundled runtime already present under `../app/.tools/node-*/npm.cmd`.

## How it works

- `npm run dev`
  - starts the web frontend from `../app` on `http://127.0.0.1:4174`
  - launches a Tauri desktop window pointed at that dev server

- `npm run build`
  - runs the existing `../app` production build
  - packages the desktop shell against `../app/dist`

- `npm run tauri:info`
  - runs the Tauri CLI through a local Node wrapper instead of `tauri.cmd`
  - reuses the bundled Node runtime from `../app/.tools` when no global Node is installed

## CI bundle output

- The GitHub Actions workflow under `../.github/workflows/desktop-tauri-windows.yml` reads the desktop version from `src-tauri/tauri.conf.json`.
- It uploads two versioned artifacts:
  - a full Windows bundle directory
  - a compact installers package containing the generated `.msi` / `.exe` files and `SHA256SUMS.txt`

## Prerequisites on Windows

To build the desktop executable on Windows you still need:

1. Rust / Cargo
2. Microsoft C++ build tools (Visual Studio Build Tools or full Visual Studio with Desktop C++)
3. WebView2 runtime, if it is not already present on the target machine

## Non-admin note

- Rust / Cargo can be installed into the current user's profile.
- Visual Studio Build Tools normally requires administrator approval on Windows unless your IT policy explicitly allows standard users to install or modify it.
- If your account is a standard user, the practical path is usually:
  - keep local development focused on the web app and Tauri wrapper wiring
  - build the final Windows desktop bundle on a CI runner or on a machine where MSVC build tools are already available

## Current state in this repo

- The desktop wrapper is scaffolded and wired to the current web app.
- Icon assets were generated from the current Everest logo for Windows-oriented packaging.
- A user-scoped Rust toolchain has been installed successfully on this machine.
- Local executable bundling is still blocked by the missing Visual Studio Build Tools / Windows SDK toolchain.
- A GitHub Actions workflow is included to build the Windows desktop bundle without changing the current web app structure.
