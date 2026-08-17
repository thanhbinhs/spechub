import { BadRequestException } from "@nestjs/common";
import { load } from "cheerio";

export type OfficialCatalogEntityType = "device" | "hardware-module";

export type OfficialUrlExtraction = {
  sourceLabel: string;
  values: Record<string, string>;
};

type Evidence = {
  value: string;
  excerpt: string;
};

type PageSnapshot = {
  title: string;
  h1: string;
  description: string;
  pairs: Array<{ label: string; value: string; excerpt: string }>;
  sections: Array<{ label: string; value: string; excerpt: string }>;
  product: Record<string, unknown> | null;
};

const OFFICIAL_SOURCES = {
  apple: "Apple Tech Specs",
  google: "Google Store Tech Specs",
  samsung: "Samsung Specifications",
  qualcomm: "Qualcomm Product Specifications",
  amd: "AMD Product Specifications",
} as const;

export type OfficialSource = keyof typeof OFFICIAL_SOURCES;

/**
 * Extracts only explicitly published values from a small, allowlisted set of
 * official product pages. Unknown sources are intentionally rejected: a blank
 * field is preferable to an incorrect catalog value.
 */
export function extractOfficialCatalogUrl(
  entityType: OfficialCatalogEntityType,
  urlValue: string,
  html: string,
): OfficialUrlExtraction {
  const source = assertSupportedOfficialCatalogUrl(entityType, urlValue);
  const page = snapshot(html, source, urlValue);
  const values =
    entityType === "device"
      ? deviceValues(page, source)
      : hardwareValues(page, source);

  if (!values.name) {
    throw new BadRequestException(
      "Không xác định được tên sản phẩm từ trang thông số chính thức. Hãy dùng URL Tech Specs cụ thể của đúng model.",
    );
  }
  assertUsefulExtraction(entityType, values);

  values.__official_source = source;
  values.raw_text = Object.entries(values)
    .filter(([key, value]) => !key.startsWith("__") && value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  return { sourceLabel: OFFICIAL_SOURCES[source], values };
}

export function assertSupportedOfficialCatalogUrl(
  entityType: OfficialCatalogEntityType,
  urlValue: string,
): OfficialSource {
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new BadRequestException("URL không hợp lệ.");
  }
  return supportedSource(url, entityType);
}

function supportedSource(
  url: URL,
  entityType: OfficialCatalogEntityType,
): OfficialSource {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  if (
    entityType === "device" &&
    isOfficialHost(host, "apple.com") &&
    path.includes("/specs/")
  ) {
    return "apple";
  }
  if (
    entityType === "device" &&
    host === "store.google.com" &&
    path.includes("/product/") &&
    path.includes("_specs")
  ) {
    return "google";
  }
  if (
    entityType === "device" &&
    isOfficialHost(host, "samsung.com") &&
    path.includes("/specs/")
  ) {
    return "samsung";
  }
  if (
    entityType === "hardware-module" &&
    isOfficialHost(host, "qualcomm.com") &&
    /^\/smartphones\/products\/[^/]+\/[^/]+/.test(path)
  ) {
    return "qualcomm";
  }
  if (
    entityType === "hardware-module" &&
    isOfficialHost(host, "amd.com") &&
    /^\/en\/products\/.*\.html$/.test(path) &&
    !path.includes("specifications.html")
  ) {
    return "amd";
  }
  const expected =
    entityType === "device"
      ? "Apple /specs/, Google Store *_specs hoặc Samsung /specs/"
      : "trang sản phẩm cụ thể của Qualcomm hoặc AMD";
  throw new BadRequestException(
    `URL chưa được hỗ trợ an toàn. Hãy dùng ${expected}; không dùng trang danh mục, bán hàng hay review.`,
  );
}

function isOfficialHost(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

function snapshot(
  html: string,
  source: OfficialSource,
  urlValue: string,
): PageSnapshot {
  const $ = load(html);
  $("script:not([type='application/ld+json']), style, noscript, svg").remove();
  const text = (value: string | null | undefined) => clean(value ?? "");
  const pairs: PageSnapshot["pairs"] = [];
  const add = (label: string, value: string) => {
    const normalizedLabel = text(label);
    const normalizedValue = text(value);
    if (!normalizedLabel || !normalizedValue) return;
    const retainedValue = normalizedValue.slice(0, 12_000);
    pairs.push({
      label: normalizedLabel,
      value: retainedValue,
      excerpt: `${normalizedLabel}: ${retainedValue}`.slice(0, 500),
    });
  };
  let scopedName = "";

  if (source === "google") {
    const urlPath = new URL(urlValue).pathname.toLowerCase();
    $("table").each((_, table) => {
      const rows = $(table).find("tr");
      const headers = rows
        .first()
        .children("th,td")
        .map((__, cell) => structuredText($, $(cell)))
        .get()
        .filter(Boolean);
      if (headers.length < 2) return;
      const targetIndex = headers.findIndex((header) =>
        urlPath.includes(
          normalize(header)
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, ""),
        ),
      );
      if (targetIndex < 0) return;
      scopedName ||= headers[targetIndex] ?? "";
      let currentLabel = "";
      rows.slice(1).each((__, row) => {
        const cells = $(row).children("th,td");
        if (cells.length === 1) {
          currentLabel = structuredText($, cells.first());
          return;
        }
        const targetCell = cells.eq(targetIndex);
        if (currentLabel && targetCell.length) {
          add(currentLabel, structuredText($, targetCell));
        }
      });
    });
  }

  if (source === "apple") {
    const targetModel = appleProductName(text($("h1").first().text()));
    $("[role~='rowgroup']").each((_, section) => {
      const header = $(section).find("[role~='rowheader']").first();
      const label = textWithoutFootnotes($, header);
      if (!label) return;

      const values: string[] = [];
      $(section)
        .children("[role~='row']")
        .each((__, row) => {
          $(row)
            .children("[role~='cell']")
            .each((___, cell) => {
              const clone = $(cell).clone();
              clone.find(".footnote, sup").remove();
              const heading = text(
                clone.find(".techspecs-small-heading").first().text(),
              );
              if (!appleColumnApplies(heading, targetModel)) return;
              if (isAppleModelHeading(heading) || isSharedHeading(heading)) {
                clone.find(".techspecs-small-heading").first().remove();
              }
              clone.find("br").replaceWith(" ");
              clone.find("li, p, figcaption").each((____, item) => {
                $(item).append(" ");
              });
              const value = text(clone.text());
              if (value && !values.includes(value)) values.push(value);
            });
        });
      add(label, values.join(" · "));
    });
  }

  $("table tr").each((_, element) => {
    const cells = $(element)
      .find("th,td")
      .map((__, cell) => text($(cell).text()))
      .get()
      .filter(Boolean);
    if (cells.length >= 2) add(cells[0]!, cells.slice(1).join(" · "));
  });
  $("dl dt").each((_, element) =>
    add($(element).text(), $(element).next("dd").text()),
  );
  $("[data-spec-name]").each((_, element) =>
    add($(element).attr("data-spec-name") ?? "", $(element).text()),
  );

  const sections: PageSnapshot["sections"] = [];
  $("h2,h3,h4").each((_, element) => {
    const label = text($(element).text());
    const value = text($(element).nextUntil("h1,h2,h3,h4").text()).slice(
      0,
      12_000,
    );
    if (label && value) {
      sections.push({
        label,
        value,
        excerpt: `${label}: ${value}`.slice(0, 500),
      });
    }
  });

  const product = jsonLdProduct(
    $("script[type='application/ld+json']")
      .map((_, item) => $(item).contents().text())
      .get(),
  );
  if (product) {
    const properties = product.additionalProperty;
    if (Array.isArray(properties)) {
      for (const property of properties) {
        if (
          property &&
          typeof property === "object" &&
          typeof (property as Record<string, unknown>).name === "string" &&
          typeof (property as Record<string, unknown>).value === "string"
        ) {
          add(
            (property as Record<string, string>).name,
            (property as Record<string, string>).value,
          );
        }
      }
    }
  }
  return {
    title: text($("title").first().text()),
    h1: scopedName || text($("h1").first().text()),
    description:
      text($("meta[name='description']").attr("content")) ||
      text($("meta[property='og:description']").attr("content")),
    pairs,
    sections,
    product,
  };
}

function deviceValues(page: PageSnapshot, source: OfficialSource) {
  const fields: Record<string, string> = {};
  const name = productName(page, source);
  set(fields, "name", name);
  set(fields, "summary", productDescription(page));
  const specifications: Record<string, string[]> = {
    chipset: ["chip", "processor", "soc"],
    display: ["display", "screen"],
    battery: [
      "power and battery",
      "battery and charging",
      "battery",
      "charging",
    ],
    camera: ["rear camera", "camera"],
    front_camera: ["truedepth camera", "front camera", "selfie camera"],
    memory: ["ram", "memory", "memory and storage"],
    storage: ["storage", "capacity", "memory and storage"],
    dimensions: [
      "size and weight",
      "dimensions and weight",
      "dimensions",
      "dimension",
    ],
    ingress_protection: [
      "splash, water, and dust resistant",
      "water and dust resistance",
      "ingress protection",
      "materials and durability",
    ],
    connectivity: [
      "cellular and wireless",
      "connectivity and location",
      "connectivity",
      "wireless",
    ],
    charging: ["charging and expansion", "charging"],
    wireless_charging: ["magsafe and wireless charging", "wireless charging"],
    sim: ["sim card", "sim", "sims"],
    operating_system: ["operating system", "os"],
    finish: ["finish", "colors", "colours"],
    sku: ["model number", "model code", "model"],
    announcement_date: ["announced", "announcement date"],
    release_date: ["release date", "released"],
  };
  for (const [field, aliases] of Object.entries(specifications)) {
    const found = evidence(page, aliases);
    set(fields, field, found);
    addEvidence(fields, field, found);
  }
  addEvidence(fields, "name", name);
  addEvidence(fields, "summary", productDescription(page));
  fields.__adapter = source;
  return fields;
}

function hardwareValues(page: PageSnapshot, source: OfficialSource) {
  const fields: Record<string, string> = {};
  const name = productName(page);
  const description = productDescription(page);
  set(fields, "name", name);
  set(fields, "description", description);
  set(
    fields,
    "cores",
    evidence(page, ["# of cpu cores", "cpu cores", "cores"]),
  );
  set(fields, "threads", evidence(page, ["# of threads", "threads"]));
  set(
    fields,
    "clock",
    evidence(page, [
      "max boost clock",
      "max clock",
      "cpu clock speed",
      "clock",
    ]),
  );
  set(fields, "tops", evidence(page, ["npu tops", "ai performance", "tops"]));
  set(fields, "gpu", evidence(page, ["graphics model", "gpu"]));
  set(fields, "modem", evidence(page, ["cellular modem", "modem"]));
  set(
    fields,
    "process",
    evidence(page, ["process node", "processor technology"]),
  );
  addEvidence(fields, "name", name);
  addEvidence(fields, "description", description);
  for (const field of [
    "cores",
    "threads",
    "clock",
    "tops",
    "gpu",
    "modem",
    "process",
  ]) {
    addEvidence(fields, field, evidence(page, fieldAliases(field)));
  }
  fields.__adapter = source;
  return fields;
}

function productName(
  page: PageSnapshot,
  source?: OfficialSource,
): Evidence | null {
  if ((source === "apple" || source === "google") && page.h1) {
    const value = source === "apple" ? appleProductName(page.h1) : page.h1;
    if (value) return { value, excerpt: `H1: ${page.h1}` };
  }
  const jsonName = page.product?.name;
  if (typeof jsonName === "string" && clean(jsonName)) {
    return {
      value: clean(jsonName),
      excerpt: `JSON-LD Product name: ${clean(jsonName)}`,
    };
  }
  if (page.h1) return { value: page.h1, excerpt: `H1: ${page.h1}` };
  return null;
}

function appleProductName(value: string) {
  return clean(
    value.replace(
      /\s*(?:[-–—]\s*)?(?:technical specifications|tech specs).*$/i,
      "",
    ),
  );
}

function textWithoutFootnotes(
  $: ReturnType<typeof load>,
  element: ReturnType<ReturnType<typeof load>>,
) {
  const clone = element.clone();
  clone.find(".footnote, sup").remove();
  return clean(clone.text());
}

function structuredText(
  $: ReturnType<typeof load>,
  element: ReturnType<ReturnType<typeof load>>,
) {
  const clone = element.clone();
  clone.find(".footnote, sup").remove();
  clone.find("br").replaceWith(" ");
  clone.find("div, li, p, figcaption").each((_, item) => {
    $(item).append(" ");
  });
  return clean(clone.text());
}

function appleColumnApplies(heading: string, targetModel: string) {
  if (!heading || isSharedHeading(heading) || !isAppleModelHeading(heading)) {
    return true;
  }
  return normalize(heading) === normalize(targetModel);
}

function isAppleModelHeading(value: string) {
  return /^iphone\b/i.test(clean(value));
}

function isSharedHeading(value: string) {
  return /^(?:both|all) models?$/i.test(clean(value));
}

function assertUsefulExtraction(
  entityType: OfficialCatalogEntityType,
  fields: Record<string, string>,
) {
  const usefulKeys =
    entityType === "device"
      ? [
          "chipset",
          "display",
          "battery",
          "camera",
          "front_camera",
          "memory",
          "storage",
          "dimensions",
          "ingress_protection",
          "connectivity",
          "wireless_charging",
          "sim",
          "operating_system",
        ]
      : ["cores", "threads", "clock", "tops", "gpu", "modem", "process"];
  const minimum = entityType === "device" ? 3 : 2;
  const usefulCount = usefulKeys.filter((key) => fields[key]).length;
  if (usefulCount < minimum) {
    throw new BadRequestException(
      "Trang chính thức trả về quá ít thông số hữu ích để tạo bản nháp an toàn. SpecHub đã dừng thay vì chỉ tạo tên và mô tả; hãy thử lại URL Tech Specs cụ thể hoặc dán thông số.",
    );
  }
}

function productDescription(page: PageSnapshot): Evidence | null {
  const jsonDescription = page.product?.description;
  if (typeof jsonDescription === "string" && clean(jsonDescription)) {
    return {
      value: clean(jsonDescription),
      excerpt: `JSON-LD Product description: ${clean(jsonDescription)}`.slice(
        0,
        500,
      ),
    };
  }
  return page.description
    ? {
        value: page.description,
        excerpt: `Meta description: ${page.description}`.slice(0, 500),
      }
    : null;
}

function evidence(page: PageSnapshot, aliases: string[]): Evidence | null {
  const normalized = aliases.map(normalize);
  const match = page.pairs.find((item) =>
    normalized.some((alias) => normalize(item.label) === alias),
  );
  if (match) return { value: match.value, excerpt: match.excerpt };
  const section = page.sections.find((item) =>
    normalized.some((alias) => normalize(item.label) === alias),
  );
  return section ? { value: section.value, excerpt: section.excerpt } : null;
}

function fieldAliases(field: string) {
  const aliases: Record<string, string[]> = {
    chipset: ["chip", "processor", "soc"],
    display: ["display", "screen"],
    battery: ["battery and charging", "battery", "charging"],
    camera: ["rear camera", "camera"],
    memory: ["ram", "memory"],
    storage: ["storage", "capacity"],
    sku: ["model number", "model code", "model"],
    announcement_date: ["announced", "announcement date"],
    release_date: ["release date", "released"],
    cores: ["# of cpu cores", "cpu cores", "cores"],
    threads: ["# of threads", "threads"],
    clock: ["max boost clock", "max clock", "cpu clock speed", "clock"],
    tops: ["npu tops", "ai performance", "tops"],
    gpu: ["graphics model", "gpu"],
    modem: ["cellular modem", "modem"],
    process: ["process node", "processor technology"],
  };
  return aliases[field] ?? [];
}

function set(
  fields: Record<string, string>,
  key: string,
  value: Evidence | null,
) {
  if (value?.value) fields[key] = value.value;
}

function addEvidence(
  fields: Record<string, string>,
  key: string,
  value: Evidence | null,
) {
  if (value?.excerpt) fields[`__evidence_${key}`] = value.excerpt;
}

function jsonLdProduct(documents: string[]) {
  for (const document of documents) {
    try {
      const product = findProduct(JSON.parse(document));
      if (product) return product;
    } catch {
      // Invalid JSON-LD is ignored; visible HTML can still provide evidence.
    }
  }
  return null;
}

function findProduct(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProduct(item);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
    return record;
  }
  return findProduct(record["@graph"]);
}

function normalize(value: string) {
  return clean(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
