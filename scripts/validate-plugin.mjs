#!/usr/bin/env node
// Lightweight validator for the learning-with-court marketplace.
// - Confirms .claude-plugin/marketplace.json parses and has the required shape.
// - If a plugin/ subdirectory exists, walks any plugin/skills/*.md files and
//   confirms each has YAML frontmatter with `name` and `description`.
// Exits non-zero on first failure; logs are GH-Actions-friendly.

import { readFileSync, statSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const errors = [];

function fail(file, msg) {
  errors.push(`${file}: ${msg}`);
  console.log(`::error file=${file}::${msg}`);
}

function ok(file, msg) {
  console.log(`✓ ${relative(ROOT, file)} — ${msg}`);
}

// ---- 1. marketplace.json ----
const marketplacePath = join(ROOT, ".claude-plugin", "marketplace.json");
if (!existsSync(marketplacePath)) {
  fail(marketplacePath, "marketplace.json is missing");
} else {
  let data;
  try {
    data = JSON.parse(readFileSync(marketplacePath, "utf8"));
  } catch (e) {
    fail(marketplacePath, `invalid JSON: ${e.message}`);
  }
  if (data) {
    if (typeof data.name !== "string" || !data.name)
      fail(marketplacePath, "missing required field: name");
    if (!data.owner || typeof data.owner !== "object")
      fail(marketplacePath, "missing required field: owner");
    if (!Array.isArray(data.plugins) || data.plugins.length === 0)
      fail(marketplacePath, "plugins must be a non-empty array");
    if (Array.isArray(data.plugins)) {
      data.plugins.forEach((p, i) => {
        const where = `plugins[${i}]`;
        if (!p.name) fail(marketplacePath, `${where}: missing name`);
        if (!p.source) fail(marketplacePath, `${where}: missing source`);
        if (!p.version) fail(marketplacePath, `${where}: missing version`);
      });
    }
    if (errors.length === 0)
      ok(marketplacePath, `${data.plugins.length} plugin(s) declared`);
  }
}

// ---- 2. skill frontmatter (best effort) ----
const skillsDir = join(ROOT, "plugin", "skills");
if (existsSync(skillsDir) && statSync(skillsDir).isDirectory()) {
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const skillPath = join(skillsDir, entry.name);
    const content = readFileSync(skillPath, "utf8");
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) {
      fail(skillPath, "missing YAML frontmatter");
      continue;
    }
    const block = fm[1];
    if (!/^name:\s*\S/m.test(block))
      fail(skillPath, "frontmatter missing `name`");
    if (!/^description:\s*\S/m.test(block))
      fail(skillPath, "frontmatter missing `description`");
    if (
      /^name:\s*\S/m.test(block) &&
      /^description:\s*\S/m.test(block)
    )
      ok(skillPath, "frontmatter ok");
  }
} else {
  console.log(`(no plugin/skills/ dir — skipping skill validation)`);
}

if (errors.length > 0) {
  console.log(`\n${errors.length} validation error(s)`);
  process.exit(1);
}
console.log(`\nAll checks passed.`);
