#!/usr/bin/env node
/** Sync docs UI_FINAL_DB → runtime mirror JSON + game/src/game/uiFinal.ts */
import { readDb, syncMirror } from "./lib.mjs";

const db = readDb();
const result = syncMirror(db);
console.log(
  `Synced UI_FINAL_DB — released=${result.releasedCount}\n  ${result.mirrorPath}\n  ${result.tsPath}`,
);
