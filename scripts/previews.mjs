// Rebuild an Art Blocks project's small previews in .assets/<project>/<tokenId>.webp from the
// Art Blocks thumbnails, then upload them to the gps-assets R2 bucket (see README). They stay out
// of git. The project names its catalog, src/data/<project>.json. Needs cwebp (`brew install webp`).
// Skips files that already exist and fetches one at a time, since Art Blocks answers bursts with 429.
//
//   node scripts/previews.mjs --project meridian [--out dir] [--quality 80] [--limit n]

import { execFile } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, [])
);
const project = args.project ?? "fidenza";
const out = args.out ?? `.assets/${project}`;
const quality = args.quality ?? "80";
const limit = Number(args.limit ?? Infinity);
const LONG_SIDE = 400; // 333x400 for Fidenza's 5:6, 225x400 for Meridian's 9:16
const PAUSE = 400; // ms between fetches

const tokens = JSON.parse(readFileSync(`src/data/${project}.json`, "utf8"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
mkdirSync(out, { recursive: true });

let made = 0;
for (const { id, aspect } of tokens.slice(0, limit)) {
  const file = join(out, `${id}.webp`);
  if (existsSync(file)) continue;
  let response;
  for (let attempt = 0; attempt < 6; attempt++) {
    response = await fetch(`https://media.artblocks.io/thumb/${id}.png`);
    if (response.status !== 429) break;
    await sleep(2000 * 2 ** attempt); // back off when rate-limited
  }
  if (!response.ok) {
    console.error(`${id}: ${response.status}`);
    continue;
  }
  const png = join(tmpdir(), `${project}-${id}.png`);
  writeFileSync(png, Buffer.from(await response.arrayBuffer()));
  // The long side gets LONG_SIDE; 0 keeps the other side in proportion
  const size = aspect > 1 ? [`${LONG_SIDE}`, "0"] : ["0", `${LONG_SIDE}`];
  await run("cwebp", [
    "-quiet",
    "-q",
    quality,
    "-m",
    "6",
    "-resize",
    ...size,
    png,
    "-o",
    file,
  ]);
  rmSync(png);
  made++;
  if (made % 50 === 0) console.log(`${made} made`);
  await sleep(PAUSE);
}
console.log(`done: ${made} made`);
