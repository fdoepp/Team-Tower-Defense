#!/usr/bin/env node
/**
 * Approve a pending UI icon and place it into the Final DB (released).
 * HARD GATE: requires --by <name>. Refuses without passing validation.
 */
import fs from "node:fs";
import path from "node:path";
import {
  PENDING_DIR,
  RELEASED_DIR,
  readDb,
  syncMirror,
  validatePng,
  writeDb,
} from "./lib.mjs";

function usage() {
  console.log(`Usage: node scripts/ui-final/approve.mjs <id> --by <approver>`);
  console.log(`  Only after your explicit freigabe. Copies pending → ui-final/released.`);
  process.exit(2);
}

const args = process.argv.slice(2);
const id = args[0];
let by = null;
for (let i = 1; i < args.length; i++) {
  if (args[i] === "--by") by = args[++i];
}
if (!id || !by) usage();

const db = readDb();
const pending = db.pending?.[id];
if (!pending) {
  console.error(`No pending entry for id=${id}`);
  console.error("Propose first: node scripts/ui-final/propose.mjs <png> --id " + id);
  process.exit(1);
}

const pendingFile = path.join(PENDING_DIR, pending.file);
if (!fs.existsSync(pendingFile)) {
  console.error("pending file missing:", pendingFile);
  process.exit(1);
}

const validation = validatePng(pendingFile);
if (!validation.ok) {
  console.error("Validation FAILED — refusing approve:");
  for (const r of validation.reasons || []) console.error(" ", r);
  process.exit(1);
}

fs.mkdirSync(RELEASED_DIR, { recursive: true });
const releasedFile = path.join(RELEASED_DIR, pending.file);
fs.copyFileSync(pendingFile, releasedFile);

db.released = db.released || {};
db.released[id] = {
  id,
  file: pending.file,
  status: "released",
  role: pending.role || "ui",
  requirements: {
    freigestellt: true,
    preserveAspect: true,
    format: "png",
  },
  validation,
  approvedBy: by,
  approvedAt: new Date().toISOString(),
  notes: pending.notes || "",
};

delete db.pending[id];
writeDb(db);
const sync = syncMirror(db);

console.log(`RELEASED ${id}`);
console.log(`  approvedBy=${by}`);
console.log(`  file=game/public/icons/ui-final/${pending.file}`);
console.log(`  native ${validation.native.w}x${validation.native.h} (preserveAspect)`);
console.log(`  sync: released=${sync.releasedCount} → ${path.relative(process.cwd(), sync.tsPath)}`);
