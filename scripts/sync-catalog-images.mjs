import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const sourceFile = path.join(
  root,
  "packages/database/prisma/catalog-image-sources.json",
);
const reportFile = path.join(
  root,
  "packages/database/prisma/catalog-image-report.json",
);

const { devices, hardware = [] } = JSON.parse(
  await readFile(sourceFile, "utf8"),
);
const requestedSlugs = new Set(
  (process.env.CATALOG_IMAGE_SLUGS ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean),
);
const sharp = await loadSharp();
const collections = [
  {
    name: "device",
    items: devices,
    outputDirectory: path.join(root, "apps/web/public/images/devices"),
    localDirectory: "devices",
  },
  {
    name: "hardware",
    items: hardware,
    outputDirectory: path.join(root, "apps/web/public/images/hardware"),
    localDirectory: "hardware",
  },
];

const results = [];
for (const collection of collections) {
  await mkdir(collection.outputDirectory, { recursive: true });
  for (const item of collection.items) {
    if (requestedSlugs.size > 0 && !requestedSlugs.has(item.slug)) continue;
    try {
      let resolvedSourcePage = item.sourcePage;
      let selectedImage;
      if (item.imageUrl) {
        selectedImage = await downloadImageCandidate(
          {
            url: item.imageUrl,
            score: 1_000,
            reason: "explicit",
            page: item.imagePage,
          },
          item.sourcePage,
        );
      } else {
        const pageResponse = await fetch(item.sourcePage, {
          redirect: "follow",
          headers: browserHeaders(),
          signal: AbortSignal.timeout(30000),
        });
        if (!pageResponse.ok) {
          throw new Error(`page HTTP ${pageResponse.status}`);
        }
        resolvedSourcePage = pageResponse.url;
        const html = await pageResponse.text();
        selectedImage = await selectBestImage(
          extractImageCandidates(html, pageResponse.url, item),
          pageResponse.url,
        );
      }
      if (!selectedImage) throw new Error("no usable product image");

      const {
        input,
        url: imageUrl,
        score: clarityScore,
        page: imagePage,
      } = selectedImage;
      const output = path.join(collection.outputDirectory, `${item.slug}.webp`);
      await sharp(input, {
        failOn: "none",
        ...(Number.isInteger(imagePage) ? { page: imagePage } : {}),
      })
        .rotate()
        .trim({ threshold: 10 })
        .resize({
          width: 1400,
          height: 1000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 88, effort: 5 })
        .toFile(output);

      const metadata = await sharp(output).metadata();
      results.push({
        collection: collection.name,
        kind: item.kind,
        slug: item.slug,
        status: "ok",
        sourcePage: resolvedSourcePage,
        imageUrl,
        localUrl: `/images/${collection.localDirectory}/${item.slug}.webp`,
        width: metadata.width,
        height: metadata.height,
        clarityScore: Math.round(clarityScore),
        ...(Number.isInteger(imagePage) ? { imagePage } : {}),
      });
      process.stdout.write(`✓ ${collection.name}:${item.slug}\n`);
    } catch (error) {
      results.push({
        collection: collection.name,
        kind: item.kind,
        slug: item.slug,
        status: "error",
        sourcePage: item.sourcePage,
        error: error instanceof Error ? error.message : String(error),
      });
      process.stderr.write(
        `✗ ${collection.name}:${item.slug}: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
  }
}

await writeFile(
  reportFile,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      successful: results.filter((item) => item.status === "ok").length,
      failed: results.filter((item) => item.status === "error").length,
      results,
    },
    null,
    2,
  )}\n`,
);

if (results.some((item) => item.status === "error")) process.exitCode = 1;

function browserHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*",
    "Accept-Language": "en-US,en;q=0.9",
  };
}

function extractImageCandidates(html, baseUrl, item) {
  const candidates = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const property = getAttribute(tag, "property") ?? getAttribute(tag, "name");
    if (
      !["og:image", "og:image:url", "twitter:image"].includes(property ?? "")
    ) {
      continue;
    }
    const content = getAttribute(tag, "content");
    if (content) {
      candidates.push({
        url: resolveUrl(decodeHtml(content), baseUrl),
        score: 30,
        reason: property,
        context: tag,
      });
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const alt = getAttribute(tag, "alt") ?? "";
    const sources = [
      getAttribute(tag, "src"),
      getAttribute(tag, "data-src"),
      getAttribute(tag, "data-original"),
      largestSrcsetCandidate(getAttribute(tag, "srcset")),
      largestSrcsetCandidate(getAttribute(tag, "data-srcset")),
    ].filter(Boolean);
    for (const source of sources) {
      candidates.push({
        url: resolveUrl(decodeHtml(source), baseUrl),
        score: 15,
        reason: "page-image",
        context: `${alt} ${tag}`,
      });
    }
  }

  for (const match of html.matchAll(/<source\b[^>]*>/gi)) {
    const tag = match[0];
    const source =
      largestSrcsetCandidate(getAttribute(tag, "srcset")) ??
      largestSrcsetCandidate(getAttribute(tag, "data-srcset"));
    if (source) {
      candidates.push({
        url: resolveUrl(decodeHtml(source), baseUrl),
        score: 8,
        reason: "picture-source",
        context: tag,
      });
    }
  }

  const productTokens = item.slug
    .split("-")
    .filter(
      (token) =>
        token.length >= 3 &&
        !["gen", "pro", "plus", "ultra", "series"].includes(token),
    );
  const preferredTerms = item.preferredImageTerms ?? [];
  const ranked = candidates
    .filter((candidate) => candidate.url)
    .map((candidate) => {
      const haystack =
        `${candidate.url} ${candidate.context ?? ""}`.toLowerCase();
      let score = candidate.score;
      score +=
        productTokens.filter((token) => haystack.includes(token)).length * 18;
      score +=
        preferredTerms.filter((term) => haystack.includes(term.toLowerCase()))
          .length * 24;
      score +=
        countMatches(
          haystack,
          /product|device|front|back|angle|gallery|pdp|hero|kv|color|design|overview/g,
        ) * 5;
      score -=
        countMatches(
          haystack,
          /logo|icon|sprite|avatar|banner|video|youtube|lifest|feature|thumbnail|thumb|people|person|model-shot/g,
        ) * 18;
      if (/\.png(?:[?#]|$)/i.test(candidate.url)) score += 10;
      return { ...candidate, score };
    })
    .sort((left, right) => right.score - left.score);

  return [
    ...new Map(ranked.map((candidate) => [candidate.url, candidate])).values(),
  ].slice(0, 12);
}

async function selectBestImage(candidates, pageUrl) {
  const downloaded = [];
  for (const candidate of candidates.slice(0, 8)) {
    try {
      const result = await downloadImageCandidate(candidate, pageUrl);
      if (!result) continue;
      downloaded.push(result);
      if (downloaded.length >= 4 || result.score >= 115) break;
    } catch {
      // Try the next official-page candidate.
    }
  }
  return downloaded.sort((left, right) => right.score - left.score)[0] ?? null;
}

async function downloadImageCandidate(candidate, pageUrl) {
  const response = await fetch(candidate.url, {
    redirect: "follow",
    headers: {
      ...browserHeaders(),
      Referer: pageUrl,
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`image HTTP ${response.status}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (
    !contentType.startsWith("image/") &&
    contentType !== "application/octet-stream" &&
    !candidate.url.includes("scene7")
  ) {
    throw new Error(`not an image (${contentType || "unknown"})`);
  }
  const input = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(input, {
    failOn: "none",
    ...(Number.isInteger(candidate.page) ? { page: candidate.page } : {}),
  }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("image dimensions unavailable");
  }
  if (metadata.width < 320 || metadata.height < 240) {
    throw new Error(`image too small (${metadata.width}x${metadata.height})`);
  }
  const aspect = metadata.width / metadata.height;
  const aspectScore =
    aspect >= 0.55 && aspect <= 2.4 ? 24 : aspect <= 3.2 ? 8 : -30;
  const resolutionScore = Math.min(
    30,
    Math.log2(metadata.width * metadata.height) * 1.35,
  );
  const alphaScore = metadata.hasAlpha ? 18 : 0;
  return {
    input,
    url: response.url,
    score: candidate.score + aspectScore + resolutionScore + alphaScore,
    ...(Number.isInteger(candidate.page) ? { page: candidate.page } : {}),
  };
}

function largestSrcsetCandidate(value) {
  if (!value) return null;
  return value
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean)
    .at(-1);
}

function countMatches(value, expression) {
  return [...value.matchAll(expression)].length;
}

function getAttribute(tag, name) {
  const expression = new RegExp(
    `\\b${name}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = tag.match(expression);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function resolveUrl(value, baseUrl) {
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return null;
  }
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
