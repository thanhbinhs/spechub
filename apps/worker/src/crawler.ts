import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { PrismaClient } from "@spechub/database";

const DEFAULT_MAX_PAGES_PER_RUN = 10;
const DEFAULT_MAX_HTML_BYTES = 1_000_000;
const MAX_PAGES_PER_RUN = 50;
const MAX_HTML_BYTES = 2_000_000;
const MAX_REDIRECTS = 3;

type CrawlerConfig = {
  seed_urls: string[];
  allowed_paths: string[];
  discover_links: boolean;
  max_pages_per_run: number;
  rate_limit_ms: number;
  max_html_bytes: number;
  user_agent: string;
};

type ActiveSource = {
  id: string;
  name: string;
  base_url: string;
  crawl_config: unknown;
};

type CrawlSourceOptions = {
  fetcher: typeof fetch;
  allowHttp: boolean;
};

export type CrawlerRunResult = {
  sources: number;
  fetched: number;
  failed: number;
  skipped: number;
};

export async function crawlActiveSources(
  prisma: PrismaClient,
  options: {
    fetcher?: typeof fetch;
    allowHttp?: boolean;
  } = {},
): Promise<CrawlerRunResult> {
  const sources = await prisma.data_sources.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      base_url: true,
      crawl_config: true,
    },
  });
  const totals: CrawlerRunResult = {
    sources: sources.length,
    fetched: 0,
    failed: 0,
    skipped: 0,
  };

  for (const source of sources) {
    const result = await crawlSource(prisma, source, {
      fetcher: options.fetcher ?? fetch,
      allowHttp: options.allowHttp ?? false,
    });
    totals.fetched += result.fetched;
    totals.failed += result.failed;
    totals.skipped += result.skipped;
  }

  return totals;
}

async function crawlSource(
  prisma: PrismaClient,
  source: ActiveSource,
  options: CrawlSourceOptions,
) {
  const baseUrl = new URL(source.base_url);
  const config = parseCrawlerConfig(source.crawl_config, baseUrl);
  const queue = [...config.seed_urls];
  const seen = new Set<string>();
  let fetched = 0;
  let failed = 0;
  let skipped = 0;

  while (queue.length > 0 && seen.size < config.max_pages_per_run) {
    const candidate = queue.shift();
    if (!candidate) continue;

    let url: URL;
    try {
      url = new URL(candidate, baseUrl);
      await assertSafeSourceUrl(url, baseUrl, config, options.allowHttp);
    } catch (error) {
      skipped += 1;
      console.warn(
        `[crawler-worker] skipped unsafe URL for ${source.name}: ${candidate} (${formatError(error)})`,
      );
      continue;
    }

    if (seen.has(url.href)) continue;
    seen.add(url.href);

    try {
      const page = await fetchHtml(url, {
        fetcher: options.fetcher,
        baseUrl,
        config,
        allowHttp: options.allowHttp,
      });
      await prisma.raw_pages.upsert({
        where: { url: page.url },
        create: {
          source_id: source.id,
          url: page.url,
          raw_html: page.html,
          raw_text: extractText(page.html),
          status: "needs_review",
          crawled_at: new Date(),
        },
        update: {
          source_id: source.id,
          raw_html: page.html,
          raw_text: extractText(page.html),
          parsed_data: undefined,
          status: "needs_review",
          error_message: null,
          attempts: { increment: 1 },
          crawled_at: new Date(),
          parsed_at: null,
        },
      });
      fetched += 1;

      if (config.discover_links) {
        for (const link of extractLinks(page.html, page.url)) {
          if (seen.has(link) || queue.includes(link)) continue;
          try {
            await assertSafeSourceUrl(
              new URL(link),
              baseUrl,
              config,
              options.allowHttp,
            );
            queue.push(link);
          } catch {
            skipped += 1;
          }
        }
      }
    } catch (error) {
      failed += 1;
      await persistFailure(prisma, source.id, url.href, formatError(error));
      console.error(
        `[crawler-worker] failed ${source.name} ${url.href}: ${formatError(error)}`,
      );
    }

    if (config.rate_limit_ms > 0 && queue.length > 0) {
      await delay(config.rate_limit_ms);
    }
  }

  await prisma.data_sources.update({
    where: { id: source.id },
    data: { last_crawled_at: new Date() },
  });

  return { fetched, failed, skipped };
}

function parseCrawlerConfig(value: unknown, baseUrl: URL): CrawlerConfig {
  const input = isRecord(value) ? value : {};
  const configuredAllowedPaths = readStringList(input.allowed_paths)
    .map((path) => path.trim())
    .filter((path) => path.startsWith("/"));
  const allowedPaths =
    configuredAllowedPaths.length > 0 ? configuredAllowedPaths : ["/"];
  const configuredSeedUrls = readStringList(input.seed_urls)
    .map((url) => new URL(url, baseUrl).href)
    .slice(0, MAX_PAGES_PER_RUN);
  const seedUrls =
    configuredSeedUrls.length > 0
      ? configuredSeedUrls
      : [new URL(allowedPaths[0] ?? "/", baseUrl).href];

  return {
    seed_urls: seedUrls,
    allowed_paths: allowedPaths,
    discover_links: input.discover_links === true,
    max_pages_per_run: clampInteger(
      input.max_pages_per_run,
      DEFAULT_MAX_PAGES_PER_RUN,
      1,
      MAX_PAGES_PER_RUN,
    ),
    rate_limit_ms: clampInteger(input.rate_limit_ms, 1000, 0, 60_000),
    max_html_bytes: clampInteger(
      input.max_html_bytes,
      DEFAULT_MAX_HTML_BYTES,
      10_000,
      MAX_HTML_BYTES,
    ),
    user_agent:
      typeof input.user_agent === "string" && input.user_agent.trim()
        ? input.user_agent.trim().slice(0, 200)
        : "SpecHubBot/1.0 (+https://spechub.local/crawler)",
  };
}

async function fetchHtml(
  initialUrl: URL,
  options: {
    fetcher: typeof fetch;
    baseUrl: URL;
    config: CrawlerConfig;
    allowHttp: boolean;
  },
): Promise<{ url: string; html: string }> {
  let url = initialUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await options.fetcher(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.5",
        "User-Agent": options.config.user_agent,
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location)
        throw new Error(`Redirect ${response.status} has no location`);
      url = new URL(location, url);
      await assertSafeSourceUrl(
        url,
        options.baseUrl,
        options.config,
        options.allowHttp,
      );
      continue;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error(`Unsupported content type '${contentType || "unknown"}'`);
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > options.config.max_html_bytes
    ) {
      throw new Error(
        `Response exceeds ${options.config.max_html_bytes} byte limit`,
      );
    }

    return {
      url: url.href,
      html: await readBody(response, options.config.max_html_bytes),
    };
  }

  throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
}

async function assertSafeSourceUrl(
  url: URL,
  baseUrl: URL,
  config: CrawlerConfig,
  allowHttp: boolean,
) {
  if (url.username || url.password)
    throw new Error("Credentials in URLs are not allowed");
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) {
    throw new Error("Only HTTPS URLs are allowed");
  }
  if (url.origin !== baseUrl.origin)
    throw new Error("URL must remain on the configured origin");
  if (!config.allowed_paths.some((path) => url.pathname.startsWith(path))) {
    throw new Error("URL path is not allowed by crawl_config.allowed_paths");
  }
  await assertPublicHostname(url.hostname);
}

async function assertPublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    throw new Error("Localhost is not crawlable");
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (
    addresses.length === 0 ||
    addresses.some((entry) => isPrivateAddress(entry.address))
  ) {
    throw new Error("Hostname resolves to a private or reserved address");
  }
}

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) {
    const [first = 0, second = 0] = address.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  );
}

async function readBody(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response has no body");

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`Response exceeds ${maxBytes} byte limit`);
    }
    chunks.push(value);
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(result);
}

function extractLinks(html: string, pageUrl: string) {
  const matches = html.matchAll(/\bhref\s*=\s*["']([^"'#]+)["']/gi);
  const links: string[] = [];
  for (const match of matches) {
    try {
      const href = match[1];
      if (!href) continue;
      links.push(new URL(href, pageUrl).href);
    } catch {
      // Ignore malformed URLs; source config remains the authority for crawl scope.
    }
  }
  return links;
}

function extractText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function persistFailure(
  prisma: PrismaClient,
  sourceId: string,
  url: string,
  errorMessage: string,
) {
  await prisma.raw_pages.upsert({
    where: { url },
    create: {
      source_id: sourceId,
      url,
      status: "failed",
      error_message: errorMessage.slice(0, 1_000),
      crawled_at: new Date(),
    },
    update: {
      source_id: sourceId,
      status: "failed",
      error_message: errorMessage.slice(0, 1_000),
      attempts: { increment: 1 },
      crawled_at: new Date(),
    },
  });
}

function readStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      )
    : [];
}

function clampInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed)
    ? Math.min(Math.max(parsed, min), max)
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}
