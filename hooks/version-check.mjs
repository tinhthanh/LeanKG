#!/usr/bin/env node
/**
 * Setup hook for LeanKG - version check
 * Runs at plugin startup to verify version requirements
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;

// Minimum required version
const MIN_VERSION = "0.16.0";

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function getInstalledVersion() {
  try {
    // Try to get version from Cargo.toml in the plugin or workspace
    const cargoPath = join(PLUGIN_ROOT, "..", "..", "Cargo.toml");
    const content = readFileSync(cargoPath, "utf-8");
    const match = content.match(/version\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    // Fallback: run cargo to get version
    try {
      const result = spawnSync("cargo", ["pkgid"], {
        cwd: PLUGIN_ROOT,
        timeout: 5000,
      });
      if (result.status === 0) {
        const match = result.stdout.toString().match(/#1\.0\.0\.(\d+)/);
        return match ? `0.1.0.${match[1]}` : null;
      }
    } catch {
      // ignore
    }
    return null;
  }
}

function compareVersions(a, b) {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const pA = partsA[i] || 0;
    const pB = partsB[i] || 0;
    if (pA > pB) return 1;
    if (pA < pB) return -1;
  }
  return 0;
}

async function main() {
  try {
    const raw = await readStdin();
    if (!raw.trim()) {
      // No input means skip (hook not triggered properly)
      process.exit(0);
    }

    const input = JSON.parse(raw);
    const hookName = input.hookName || input.hook_event_name || "Setup";

    if (hookName !== "Setup") {
      process.exit(0);
    }

    const installedVersion = getInstalledVersion();

    if (!installedVersion) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "Setup",
          versionCheck: "warning",
          message: "Could not determine LeanKG version. Version gating skipped.",
        },
      }));
      process.exit(0);
    }

    const versionOk = compareVersions(installedVersion, MIN_VERSION) >= 0;

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "Setup",
        versionCheck: versionOk ? "pass" : "fail",
        installedVersion,
        minimumVersion: MIN_VERSION,
        message: versionOk
          ? `LeanKG v${installedVersion} ready`
          : `LeanKG v${installedVersion} does not meet minimum v${MIN_VERSION}`,
      },
    }) + "\n");

  } catch (err) {
    console.error("Version check error:", err.message);
    process.exit(0);
  }
}

main();