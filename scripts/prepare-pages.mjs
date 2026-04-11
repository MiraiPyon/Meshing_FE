import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(scriptDir, "..", "dist");
const indexHtmlPath = path.join(distDir, "index.html");
const fallbackHtmlPath = path.join(distDir, "404.html");
const noJekyllPath = path.join(distDir, ".nojekyll");
const customDomainPath = path.join(distDir, "CNAME");

if (!existsSync(indexHtmlPath)) {
  throw new Error(`Missing build artifact: ${indexHtmlPath}`);
}

const indexHtml = await readFile(indexHtmlPath, "utf8");
await writeFile(fallbackHtmlPath, indexHtml, "utf8");
await writeFile(noJekyllPath, "", "utf8");

const customDomain = process.env.GITHUB_PAGES_CNAME?.trim();
if (customDomain) {
  await writeFile(customDomainPath, `${customDomain}\n`, "utf8");
}

console.log("Prepared GitHub Pages artifacts.");
