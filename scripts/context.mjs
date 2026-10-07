import { writeFile } from "node:fs/promises";
// CONTEXT is build-time only on Netlify. Bake in a non-secret deployment label.
const context = process.env.CONTEXT || "development";
await writeFile(new URL("../server/deployment-context.generated.js", import.meta.url), `export const deployment = ${JSON.stringify({ context, production: context === "production" })};\n`);
