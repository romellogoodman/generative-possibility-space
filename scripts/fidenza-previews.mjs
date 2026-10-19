// Rebuild the small Fidenza previews in public/fidenza/<tokenId>.webp from the Art Blocks thumbnails.
// Needs cwebp (`brew install webp`). Skips files that already exist and fetches one at a time,
// since Art Blocks answers bursts with 429.
//
//   node scripts/fidenza-previews.mjs [--out dir] [--quality 80] [--limit n]

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
const out = args.out ?? "public/fidenza";
const quality = args.quality ?? "80";
const limit = Number(args.limit ?? Infinity);
const LONG_SIDE = 400; // the thumbs are 1000x1200, so this gives 333x400
const PAUSE = 400; // ms between fetches

const tokens = JSON.parse(readFileSync("src/data/fidenza.json", "utf8"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
mkdirSync(out, { recursive: true });

let made = 0;
for (const { id } of tokens.slice(0, limit)) {
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
  const png = join(tmpdir(), `fidenza-${id}.png`);
  writeFileSync(png, Buffer.from(await response.arrayBuffer()));
  await run("cwebp", [
    "-quiet",
    "-q",
    quality,
    "-m",
    "6",
    "-resize",
    "0",
    `${LONG_SIDE}`,
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
