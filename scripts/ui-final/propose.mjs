#!/usr/bin/env node
/**
 * Propose a UI icon for Final-DB approval.
 * Copies into docs/icons/ui-final/pending/ and registers status pendingApproval.
 * Does NOT release — that requires approve.mjs after your explicit go-ahead.
 */
import fs from "node:fs";
import path from "node:path";
import { PENDING_DIR, readDb, validatePng, writeDb } from "./lib.mjs";

function usage() {
  console.log(`Usage: node scripts/ui-final/propose.mjs <png> --id <camelId> [--role ui]`);
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length < 1) usage();
const fileArg = args[0];
let id = null;
let role = "ui";
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--id") id = args[++i];
  else if (args[i] === "--role") role = args[++i];
}
if (!id) usage();

const src = path.resolve(fileArg);
if (!fs.existsSync(src)) {
  console.error("missing file:", src);
  process.exit(1);
}

fs.mkdirSync(PENDING_DIR, { recursive: true });
const base = path.basename(src);
const dest = path.join(PENDING_DIR, base);
fs.copyFileSync(src, dest);

const validation = validatePng(dest);
if (!validation.ok) {
  console.error("Validation FAILED — not registered:");
  for (const r of validation.reasons || []) console.error(" ", r);
  process.exit(1);
}

const db = readDb();
db.pending = db.pending || {};
if (db.released?.[id]) {
  console.error(`id ${id} is already released — revoke first if replacing`);
  process.exit(1);
}
db.pending[id] = {
  id,
  file: base,
  source: path.relative(process.cwd(), src),
  status: "pendingApproval",
  role,
  requirements: {
    freigestellt: true,
    preserveAspect: true,
    format: "png",
  },
  validation,
  notes: "Wartet auf manuelle Freigabe. Nicht in released/ verwenden.",
};
writeDb(db);
console.log(`Proposed ${id} → pending/${base}`);
console.log(`  native ${validation.native.w}x${validation.native.h} AR=${validation.aspectRatio}`);
console.log(`  freigestellt=${validation.freigestellt}`);
console.log(`Approve later with: node scripts/ui-final/approve.mjs ${id} --by <your-name>`);
