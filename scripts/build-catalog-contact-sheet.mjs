import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const sharp = await loadSharp();
const collection = process.argv[2] === "hardware" ? "hardware" : "devices";
const directory = path.join(root, "apps/web/public/images", collection);
const output =
  process.argv[3] ??
  path.join(root, `packages/database/prisma/${collection}-contact-sheet.webp`);
const files = (await readdir(directory))
  .filter((file) => file.endsWith(".webp"))
  .sort();

const columns = 5;
const cellWidth = 280;
const cellHeight = 240;
const imageWidth = 250;
const imageHeight = 178;
const rows = Math.ceil(files.length / columns);
const canvas = sharp({
  create: {
    width: columns * cellWidth,
    height: rows * cellHeight,
    channels: 4,
    background: "#f8fafc",
  },
});

const composites = [];
for (const [index, file] of files.entries()) {
  const left = (index % columns) * cellWidth + 15;
  const top = Math.floor(index / columns) * cellHeight + 12;
  const image = await sharp(path.join(directory, file))
    .rotate()
    .resize({
      width: imageWidth,
      height: imageHeight,
      fit: "contain",
      background: "#ffffff",
    })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
  const label = escapeXml(file.replace(/\.webp$/, ""));
  const labelSvg = Buffer.from(`
    <svg width="${imageWidth}" height="42" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="8" y="17" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#0f172a">${label}</text>
      <text x="8" y="34" font-family="Arial, sans-serif" font-size="10" fill="#64748b">${collection === "devices" ? "Thiết bị" : "Mô-đun phần cứng"}</text>
    </svg>
  `);
  composites.push(
    { input: image, left, top },
    { input: labelSvg, left, top: top + imageHeight + 4 },
  );
}

await canvas
  .composite(composites)
  .webp({ quality: 88, effort: 4 })
  .toFile(output);

process.stdout.write(
  `${JSON.stringify({ collection, images: files.length, output })}\n`,
);

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function loadSharp() {
  const pnpmDirectory = path.join(root, "node_modules/.pnpm");
  const entries = await readdir(pnpmDirectory);
  const sharpDirectory = entries.find((entry) => entry.startsWith("sharp@"));
  if (!sharpDirectory) throw new Error("sharp package is unavailable");
  const modulePath = path.join(
    pnpmDirectory,
    sharpDirectory,
    "node_modules/sharp/lib/index.js",
  );
  const module = await import(pathToFileURL(modulePath).href);
  return module.default;
}
