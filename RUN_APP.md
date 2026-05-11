# Run Nebula WebOS

This document explains how to run the Nebula WebOS app locally and includes helper scripts for Ubuntu and Windows.

## Prerequisites

### Ubuntu / Linux
- Node.js 18+ and npm
- Rust toolchain installed (`rustup`, `cargo`)
- Tauri prerequisites: `libssl-dev`, `pkg-config`, `libgtk-3-dev`, and other dependencies from the Tauri docs

### Windows
- Node.js 18+ and npm
- Rust toolchain installed (`rustup`, `cargo`)
- Visual Studio Build Tools with "Desktop development with C++"
- Tauri prerequisites from the Tauri Windows setup guide

## Run locally

1. Open a terminal.
2. Change into the native app directory:
   ```bash
   cd nebula-webos
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app in development mode:
   ```bash
   npm run dev
   ```

## Build the desktop app

From `nebula-webos`:
```bash
npm run build
```

The generated installer and bundles will be located under `nebula-webos/src-tauri/target/release/bundle`.

## Helper scripts

Use the provided helper scripts from the repository root:

- Ubuntu/Linux: `./run-ubuntu.sh`
- Windows: `run-windows.bat`

## Notes

- The native wrapper lives in `nebula-webos` and uses Tauri.
- If you need to update dependencies later, rerun `npm install` in `nebula-webos`.
- On Ubuntu, make `run-ubuntu.sh` executable with:
  ```bash
  chmod +x run-ubuntu.sh
  ```
