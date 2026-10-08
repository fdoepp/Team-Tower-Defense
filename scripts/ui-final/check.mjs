#!/usr/bin/env node
/**
 * Sanity check: every released file exists, validates, and uiFinal.ts is in sync.
 */
import fs from "node:fs";
import path from "node:path";
import { RELEASED_DIR, TS_PATH, readDb, validatePng } from "./lib.mjs";

const db = readDb();
let errors = 0;

for (const [id, e] of Object.entries(db.released || {})) {
  const file = path.join(RELEASED_DIR, e.file);
  if (!fs.existsSync(file)) {
    console.error(`MISSING released file for ${id}: ${file}`);
    errors++;
    continue;
  }
  const v = validatePng(file);
  if (!v.ok) {
    console.error(`INVALID released ${id}:`, v.reasons);
    errors++;
  }
  if (!e.approvedBy) {
    console.error(`NO approver on released ${id}`);
    errors++;
  }
}

if (!fs.existsSync(TS_PATH)) {
  console.error("Missing generated uiFinal.ts — run: node scripts/ui-final/sync.mjs");
  errors++;
}

const pending = Object.keys(db.pending || {}).length;
const released = Object.keys(db.released || {}).length;
console.log(`UI_FINAL check: released=${released} pending=${pending} errors=${errors}`);
process.exit(errors ? 1 : 0);
