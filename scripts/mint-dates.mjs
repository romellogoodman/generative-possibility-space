// Add each token's mint date (`minted`, ISO) to an Art Blocks project's catalog,
// src/data/<project>.json, from the Art Blocks data API. The token API has no dates.
//
//   node scripts/mint-dates.mjs --project fidenza

import { readFileSync, writeFileSync } from "node:fs";

const PROJECTS = { fidenza: 78, meridian: 163, asemica: 206 };
const CONTRACT = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";

const at = process.argv.indexOf("--project");
const project = at < 0 ? "fidenza" : process.argv[at + 1];
const file = `src/data/${project}.json`;
const tokens = JSON.parse(readFileSync(file, "utf8"));

const query = `{ tokens_metadata(
  where: { project_id: { _eq: "${CONTRACT}-${PROJECTS[project]}" } },
  order_by: { invocation: asc }, limit: 2000
) { token_id minted_at } }`;
const response = await fetch("https://data.artblocks.io/v1/graphql", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query }),
});
const { data } = await response.json();
const minted = new Map(
  data.tokens_metadata.map((t) => [Number(t.token_id), t.minted_at])
);

let missing = 0;
for (const token of tokens) {
  const date = minted.get(token.id);
  if (date) token.minted = new Date(date).toISOString();
  else missing++;
}
writeFileSync(file, JSON.stringify(tokens, null, 2) + "\n");
console.log(`${project}: ${tokens.length - missing} dated, ${missing} missing`);
