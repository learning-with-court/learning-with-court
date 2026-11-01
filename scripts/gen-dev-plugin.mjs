#!/usr/bin/env node
// Generate the `lwc-dev` plugin from the canonical `lwc` plugin.
//
// The prod plugin (plugins/lwc-workshops) is the single source of truth. The
// dev plugin (plugins/lwc-workshops-dev) is byte-identical EXCEPT:
//   - .claude-plugin/plugin.json → name "lwc-dev" + a dev note in the description
//   - README.md            → a one-line dev-channel banner prepended
//
// Why a separate plugin: `lwc` registers `lwc-dev` on the dev env, pinned to the
// marketplace's dev ref, so the dev channel tests that ref under its own name.
// Which environment it talks to comes from `lwc env`, not from the plugin.
// Generating it keeps the skills from drifting.
//
// Usage:
//   node scripts/gen-dev-plugin.mjs           # write plugins/lwc-workshops-dev
//   node scripts/gen-dev-plugin.mjs --check   # exit 1 if the committed dev
//                                             # plugin is out of sync (CI)
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  existsSync,
  statSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "plugins", "lwc-workshops");
const OUT = join(ROOT, "plugins", "lwc-workshops-dev");

const checkOnly = process.argv.includes("--check");

/** Recursively list files under dir, relative to it. */
function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listFiles(full, base));
    else out.push(relative(base, full));
  }
  return out;
}

/** Transform a source file's contents for the dev plugin. Returns the dev
 *  contents (string). Non-transformed files pass through unchanged. */
function transform(relPath, raw) {
  if (relPath === join(".claude-plugin", "plugin.json")) {
    const j = JSON.parse(raw);
    j.name = "lwc-dev";
    j.description =
      `[DEV CHANNEL — for testing] ` +
      j.description;
    return JSON.stringify(j, null, 2) + "\n";
  }
  if (relPath === "README.md") {
    return (
      "> **Dev channel.** Generated from the `lwc` plugin by " +
      "`scripts/gen-dev-plugin.mjs`. " +
      "Do not edit by hand — edit the `lwc` plugin and regenerate.\n\n" +
      raw
    );
  }
  return raw;
}

// Build the desired dev tree in memory.
const desired = new Map(); // relPath -> contents
for (const rel of listFiles(SRC)) {
  desired.set(rel, transform(rel, readFileSync(join(SRC, rel), "utf8")));
}

if (checkOnly) {
  const existing = existsSync(OUT) ? listFiles(OUT) : [];
  const drift = [];
  // Files that should exist / changed.
  for (const [rel, want] of desired) {
    const p = join(OUT, rel);
    if (!existsSync(p) || readFileSync(p, "utf8") !== want) drift.push(rel);
  }
  // Stale files that shouldn't exist.
  for (const rel of existing) if (!desired.has(rel)) drift.push(`(stale) ${rel}`);
  if (drift.length) {
    console.log(
      `::error::plugins/lwc-workshops-dev is out of sync. Run \`node scripts/gen-dev-plugin.mjs\` and commit.`,
    );
    for (const d of drift) console.log(`  drift: ${d}`);
    process.exit(1);
  }
  console.log("✓ lwc-dev plugin is in sync with the lwc plugin");
  process.exit(0);
}

// Write mode: nuke + rewrite so removed source files don't linger.
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
for (const [rel, contents] of desired) {
  const p = join(OUT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, contents);
}
console.log(`Generated ${relative(ROOT, OUT)} from ${relative(ROOT, SRC)}`);
