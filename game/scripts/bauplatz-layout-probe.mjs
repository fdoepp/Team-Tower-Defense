/** Probe boothQuad vs drawn door corridors + report arch proximity. */
import { build } from "esbuild";
import { pathToFileURL } from "url";

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

const DOORS = [
  { L: 0.4, R: 0.45, n: "AisleHN" },
  { L: 0.48, R: 0.52, n: "Neutral" },
  { L: 0.55, R: 0.6, n: "AisleNG" },
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
    const hit = DOORS.filter((d) => !(right <= d.L || left >= d.R)).map((d) => d.n);
    if (hit.length) doorHits++;
    console.log(
      `${names[b]} i${i} ${row} cx=${cx.toFixed(3)} [${left.toFixed(3)}..${right.toFixed(3)}] ${hit.length ? "DOOR:" + hit.join(",") : "ok"}`,
    );
    rows[row].push(cx);
  }
}
console.log("---");
console.log("far centers:", rows.far.map((x) => x.toFixed(3)).join("  "));
console.log("near centers:", rows.near.map((x) => x.toFixed(3)).join("  "));
console.log("doorHits:", doorHits);
console.log("side margin:", FLOOR_SIDE_MARGIN);
console.log("bands", floorBauBand(0), floorBauBand(1));
process.exit(doorHits ? 1 : 0);
