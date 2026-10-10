/** Probe boothQuad centers vs door clear lanes. */
import { createRequire } from "module";
import { pathToFileURL } from "url";
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "fs";

const outfile = "/tmp/floorGrid-probe.mjs";
await build({
  entryPoints: ["src/game/floorGrid.ts"],
  outfile,
  bundle: true,
  format: "esm",
  platform: "neutral",
});

const mod = await import(pathToFileURL(outfile).href);
const { boothQuad, FLOOR_SIDE_MARGIN, floorBauBand } = mod;

const DOOR = [
  { L: 0.345, R: 0.381, n: "Heim" },
  { L: 0.482, R: 0.518, n: "Neutral" },
  { L: 0.620, R: 0.656, n: "Gäste" },
];
const names = ["Heim", "Neutral", "Gäste"];
let doorHits = 0;
const rows = { far: [], near: [] };
for (let b = 0; b < 3; b++) {
  for (let i = 0; i < 4; i++) {
    const q = boothQuad(b, i);
    const cx = (q.tl.x + q.tr.x + q.br.x + q.bl.x) / 4;
    const left = Math.min(q.tl.x, q.bl.x);
    const right = Math.max(q.tr.x, q.br.x);
    const row = i < 2 ? "far" : "near";
    const hits = DOOR.filter((d) => !(right <= d.L || left >= d.R)).map((d) => d.n);
    if (hits.length) doorHits++;
    const line = `${names[b]} i${i} ${row} cx=${cx.toFixed(3)} [${left.toFixed(3)}..${right.toFixed(3)}] ${hits.length ? "DOOR:" + hits.join(",") : "ok"}`;
    console.log(line);
    rows[row].push(cx);
  }
}
console.log("---");
console.log("far centers:", rows.far.map((x) => x.toFixed(3)).join("  "));
console.log("near centers:", rows.near.map((x) => x.toFixed(3)).join("  "));
console.log("doorHits:", doorHits);
console.log("side margin:", FLOOR_SIDE_MARGIN);
console.log("far band:", floorBauBand(0));
console.log("near band:", floorBauBand(1));
process.exit(doorHits ? 1 : 0);
