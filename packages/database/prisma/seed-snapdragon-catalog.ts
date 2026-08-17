import { PrismaClient } from "../generated/client";
import {
  SNAPDRAGON_CATALOG_SOURCE_URL,
  SNAPDRAGON_SOURCE_RECORDS,
  type SnapdragonSourceRecord,
} from "./snapdragon-source-catalog";

const QUALCOMM_8_ELITE_SOURCE_URL =
  "https://www.qualcomm.com/smartphones/products/8-series/snapdragon-8-elite-mobile-platform";
const QUALCOMM_8_GEN_3_SOURCE_URL =
  "https://www.qualcomm.com/smartphones/products/8-series/snapdragon-8-gen-3-mobile-platform";
const NANOREVIEW_8_GEN_3_SOURCE_URL =
  "https://nanoreview.net/en/soc/qualcomm-snapdragon-8-gen-3";

const CHIPSET_FIELDS = [
  "chip_kind",
  "model_code",
  "supports_64bit",
  "integrated_5g",
  "integrated_wifi",
  "max_ram_gb",
  "max_display_resolution",
  "max_camera_mp",
  "announcement_date",
  "release_date",
  "cpus",
  "gpus",
  "npus",
  "modems",
] as const;
const CPU_FIELDS = [
  "core_count",
  "thread_count",
  "big_little",
  "isa_name",
  "microarchitecture",
  "core_type",
  "max_frequency_mhz",
  "min_frequency_mhz",
  "l1_instruction_cache",
  "l1_data_cache",
  "l2_cache",
  "l3_cache",
  "supports_64bit",
  "simd_extension",
  "virtualization",
  "out_of_order",
  "smt",
  "architecture",
  "clusters",
  "chipsets",
] as const;
const GPU_FIELDS = [
  "shader_units",
  "compute_units",
  "clock_mhz",
  "fp32_gflops",
  "ray_tracing_support",
  "api_support",
  "gpu_generation",
  "opengl_version",
  "opencl_version",
  "vulkan_version",
  "directx_feature_level",
  "metal_support",
  "cuda_support",
  "video_decode_codecs",
  "video_encode_codecs",
  "max_display_resolution",
  "architecture",
  "chipsets",
] as const;
const NPU_FIELDS = [
  "tops",
  "tops_int8",
  "tops_int4",
  "tops_fp16",
  "dedicated_npu",
  "dsp_name",
  "ai_engine_version",
  "tensor_accelerator",
  "supports_int8",
  "supports_fp16",
  "supports_fp32",
  "quantization",
  "architecture",
  "chipsets",
] as const;
const MODEM_FIELDS = [
  "max_downlink_mbps",
  "max_uplink_mbps",
  "supports_mmwave",
  "supports_satellite",
  "supported_5g_modes",
  "lte_category",
  "supports_5g_nr",
  "carrier_aggregation",
  "volte",
  "vonr",
  "dual_sim_capability",
  "supported_technologies",
  "chipsets",
] as const;

type ComponentKind = "cpu" | "gpu" | "npu" | "modem";
type ParsedRecord = {
  cpu: string | null;
  gpu: string | null;
  npu: string | null;
  modem: string | null;
  process: string | null;
  announcementDate: Date | null;
  maxCameraMp: number | null;
  rawSummary: string;
};
type ComponentReference = {
  id: string;
  sourceUrl: string;
  wasInherited: boolean;
};
type HardwareContext = Partial<Record<ComponentKind, ComponentReference>>;
type ModuleSeedContext = {
  qualcommOrganizationId: string;
  armArchitectureId: string;
  adrenoArchitectureId: string;
};
type CpuClusterSeed = {
  coreCount: number;
  clockGhz: number | null;
  microarchitecture: string | null;
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170);
}

function compact(value: string, max = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function rawCell(
  record: SnapdragonSourceRecord,
  predicate: (cell: string) => boolean,
) {
  return (
    record.raw.find(
      (cell) => !/^(?:—|n\/a|unknown)$/i.test(cell.trim()) && predicate(cell),
    ) ?? null
  );
}

function parseDate(record: SnapdragonSourceRecord) {
  const dateCell = rawCell(record, (cell) =>
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i.test(
      cell,
    ),
  );
  if (!dateCell) return null;
  const match = dateCell.match(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i,
  );
  if (!match) return null;
  const value = new Date(match[0]);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseMhz(value: string | null) {
  if (!value) return null;
  const ghz = value.match(/(?:up to\s+)?(\d+(?:\.\d+)?)\s*GHz/i);
  if (ghz) return Math.round(Number(ghz[1]) * 1000);
  const mhz = value.match(/(?:up to\s+)?(\d+(?:\.\d+)?)\s*MHz/i);
  return mhz ? Math.round(Number(mhz[1])) : null;
}

function parseCoreCount(value: string | null) {
  if (!value) return null;
  const splitCluster = value.match(/(\d+)\s*\+\s*(\d+)\s*cores?\b/i);
  if (splitCluster) return Number(splitCluster[1]) + Number(splitCluster[2]);
  const explicit = value.match(/(\d+)\s*(?:core|cores)\b/i);
  if (explicit) return Number(explicit[1]);
  // Some Qualcomm tables annotate a top-level cluster with its internal core
  // types, e.g. "4× ... (2× A715, 2× A710)". Keep the top-level count only.
  const withoutNestedClusterDetail = value.replace(
    /(\d+)\s*[×x][^(+]*(?:\([^)]*\))/gi,
    "$1×",
  );
  const topology = [
    ...withoutNestedClusterDetail.matchAll(/(\d+)\s*[×x]/gi),
  ].reduce((total, match) => total + Number(match[1]), 0);
  return topology || null;
}

function normalizeCache(value: string, unit?: string) {
  const normalizedUnit = (unit ?? "").toUpperCase();
  if (normalizedUnit === "M" || normalizedUnit === "MB") {
    return `${value} MB`;
  }
  return `${value} KB`;
}

function parseCacheData(raw: string | null) {
  if (!raw) {
    return {
      l1_instruction_cache: null,
      l1_data_cache: null,
      l2_cache: null,
      l3_cache: null,
    };
  }
  const splitL1 = raw.match(
    /(\d+(?:\.\d+)?)\s*(K|KB)\s*\+\s*(\d+(?:\.\d+)?)\s*(K|KB)?\s*L1/i,
  );
  const l2 = raw.match(/(\d+(?:\.\d+)?)\s*(K|KB|M|MB)\s*L2/i);
  const l3 = raw.match(/(\d+(?:\.\d+)?)\s*(K|KB|M|MB)\s*L3/i);
  return {
    l1_instruction_cache: splitL1
      ? normalizeCache(splitL1[1] ?? "", splitL1[2])
      : null,
    l1_data_cache: splitL1
      ? normalizeCache(splitL1[3] ?? "", splitL1[4] ?? splitL1[2])
      : null,
    l2_cache: l2 ? normalizeCache(l2[1] ?? "", l2[2]) : null,
    l3_cache: l3 ? normalizeCache(l3[1] ?? "", l3[2]) : null,
  };
}

function cpuCoreTypes(raw: string | null) {
  if (!raw) return [];
  return [
    ...new Set(
      [
        ...raw.matchAll(
          /Cortex-[AX]\d+|Krait(?:\s+\d+)?|Scorpion|ARM11|Oryon(?:\s+(?:Prime|Performance))?/gi,
        ),
      ].map((match) => match[0]),
    ),
  ];
}

function parseCpuClusters(raw: string | null): CpuClusterSeed[] {
  if (!raw) return [];
  const pairedTopology = raw.match(
    /(\d+)\s*\+\s*(\d+)\s*cores?\s*\(([^)]+)\)/i,
  );
  if (pairedTopology) {
    const layout = pairedTopology[3] ?? "";
    const clocks = [...layout.matchAll(/(\d+(?:\.\d+)?)\s*GHz/gi)].map(
      (match) => Number(match[1]),
    );
    const types = cpuCoreTypes(layout);
    return [Number(pairedTopology[1]), Number(pairedTopology[2])].map(
      (coreCount, index) => ({
        coreCount,
        clockGhz: clocks[index] ?? null,
        microarchitecture: types[index] ?? null,
      }),
    );
  }

  const clusters = raw
    .split(/\s+\+\s+/)
    .map((segment) => {
      const count = segment.match(/(\d+)\s*[×x]/i);
      const frequency = segment.match(/(\d+(?:\.\d+)?)\s*GHz/i);
      const microarchitecture = cpuCoreTypes(segment).join(" / ") || null;
      return count
        ? {
            coreCount: Number(count[1]),
            clockGhz: frequency ? Number(frequency[1]) : null,
            microarchitecture,
          }
        : null;
    })
    .filter((cluster): cluster is CpuClusterSeed => cluster !== null);
  if (clusters.length) return clusters;

  const coreCount = parseCoreCount(raw);
  return coreCount
    ? [
        {
          coreCount,
          clockGhz: parseMhz(raw)
            ? Number((parseMhz(raw)! / 1000).toFixed(2))
            : null,
          microarchitecture: cpuCoreTypes(raw).join(" / ") || null,
        },
      ]
    : [];
}

function gpuModel(raw: string | null) {
  if (!raw) return null;
  return (
    raw.match(
      /Adreno(?:\s+(?:X\d+-\d+|A\d+|\d+))?|PowerVR(?:\s+[A-Za-z0-9+ -]+)?|Mali-[A-Za-z0-9+ -]+/i,
    )?.[0] ?? null
  );
}

function cpuDetailOverrides(record: SnapdragonSourceRecord) {
  if (["SM8650-AB", "SM8650-AC"].includes(record.modelCode)) {
    return {
      isa_name: "ARMv9.2-A",
      l2_cache: "1 MB",
      l3_cache: "12 MB",
    };
  }
  return {};
}

function gpuDetailOverrides(record: SnapdragonSourceRecord) {
  if (["SM8650-AB", "SM8650-AC"].includes(record.modelCode)) {
    return {
      shader_units: 1536,
      compute_units: 6,
      ray_tracing_support: true,
      api_support: "Vulkan 1.3 / OpenCL 2.0 / DirectX 12.1",
      gpu_generation: "Adreno 700",
      opencl_version: "2.0",
      vulkan_version: "1.3",
      directx_feature_level: "12.1",
    };
  }
  return {};
}

function cpuGpuSourceUrl(record: SnapdragonSourceRecord) {
  return ["SM8650-AB", "SM8650-AC"].includes(record.modelCode)
    ? NANOREVIEW_8_GEN_3_SOURCE_URL
    : sourceUrlFor(record);
}

function parseThroughput(
  value: string | null,
  direction: "download" | "upload",
) {
  if (!value) return null;
  const match = value.match(
    new RegExp(
      `${direction}[^;,.]*?(?:up to\\s+)?(\\d+(?:\\.\\d+)?)\\s*(Gbit|Mbit)`,
      "i",
    ),
  );
  if (!match) return null;
  const multiplier = (match[2] ?? "").toLowerCase() === "gbit" ? 1000 : 1;
  return Math.round(Number(match[1] ?? 0) * multiplier);
}

function parseRecord(record: SnapdragonSourceRecord): ParsedRecord {
  const cpu = rawCell(
    record,
    (cell) =>
      /\b(?:\d+\s*(?:core|cores)|Cortex-|Kryo|Krait|Scorpion|ARM11|Oryon|Falkor|Saphira|CPU)/i.test(
        cell,
      ) && !/GPU/i.test(cell),
  );
  const gpu = rawCell(record, (cell) =>
    /\b(?:Adreno|PowerVR|Mali|software-?\s*rendered|GPU)\b/i.test(cell),
  );
  const npu = rawCell(record, (cell) =>
    /\b(?:Hexagon|DSP\/NPU|NPU|AI Engine)\b/i.test(cell),
  );
  const modem = rawCell(
    record,
    (cell) =>
      !/\b(?:Bluetooth|Wi-?Fi|FastConnect)\b/i.test(cell) &&
      /\b(?:Internal|Integrated|Gobi|X\d{2}\s*(?:5G|LTE)|LTE|5G|4G|UMTS|CDMA|GSM)\b/i.test(
        cell,
      ),
  );
  const process = rawCell(record, (cell) =>
    /\b\d+(?:\.\d+)?\s*nm\b/i.test(cell),
  );
  const cameraCell = rawCell(record, (cell) => /\b\d+\s*MP\b/i.test(cell));
  const maxCameraMp = cameraCell
    ? Math.max(
        ...[...cameraCell.matchAll(/(\d+)\s*MP\b/gi)].map((match) =>
          Number(match[1]),
        ),
      )
    : null;

  return {
    cpu,
    gpu,
    npu,
    modem,
    process,
    announcementDate: parseDate(record),
    maxCameraMp: Number.isFinite(maxCameraMp) ? maxCameraMp : null,
    rawSummary: record.raw.join(" | "),
  };
}

function sourceUrlFor(record: SnapdragonSourceRecord) {
  if (/^Snapdragon 8 Elite(?:\s|$)/i.test(record.name)) {
    return QUALCOMM_8_ELITE_SOURCE_URL;
  }
  if (/^Snapdragon 8 Gen 3(?:\s|$)/i.test(record.name)) {
    return QUALCOMM_8_GEN_3_SOURCE_URL;
  }
  return SNAPDRAGON_CATALOG_SOURCE_URL;
}

function fieldStatus(value: unknown, fields: readonly string[]) {
  const populated = new Set<string>();
  for (const field of fields) {
    if (value && Object.prototype.hasOwnProperty.call(value, field)) {
      const fieldValue = (value as Record<string, unknown>)[field];
      if (
        fieldValue !== null &&
        fieldValue !== undefined &&
        fieldValue !== ""
      ) {
        populated.add(field);
      }
    }
  }
  return populated;
}

async function seedCoverage(
  prisma: PrismaClient,
  kind: "chipset" | ComponentKind,
  moduleId: string,
  fields: readonly string[],
  populated: Set<string>,
  sourceUrl: string,
  wasInherited = false,
) {
  for (const field of fields) {
    const status = populated.has(field)
      ? wasInherited
        ? "derived"
        : "populated"
      : "not_disclosed";
    await prisma.module_field_coverage.upsert({
      where: {
        module_kind_module_id_field_key: {
          module_kind: kind,
          module_id: moduleId,
          field_key: field,
        },
      },
      update: {
        status,
        source_url: sourceUrl,
        notes:
          wasInherited && populated.has(field)
            ? "Kế thừa cấu hình phần cứng chung của SKU liền trước trong cùng bảng nguồn Qualcomm; không phải giá trị đoán."
            : status === "not_disclosed"
              ? "Nguồn đối chiếu không công bố trường này cho SKU cụ thể."
              : null,
      },
      create: {
        module_kind: kind,
        module_id: moduleId,
        field_key: field,
        status,
        source_url: sourceUrl,
        notes:
          wasInherited && populated.has(field)
            ? "Kế thừa cấu hình phần cứng chung của SKU liền trước trong cùng bảng nguồn Qualcomm; không phải giá trị đoán."
            : status === "not_disclosed"
              ? "Nguồn đối chiếu không công bố trường này cho SKU cụ thể."
              : null,
      },
    });
  }
}

async function seedCitation(
  prisma: PrismaClient,
  sourceId: string,
  url: string,
  title: string,
) {
  const existing = await prisma.citations.findFirst({ where: { url } });
  if (existing) {
    return prisma.citations.update({
      where: { id: existing.id },
      data: { source_id: sourceId, title, retrieved_at: new Date() },
    });
  }
  return prisma.citations.create({
    data: { source_id: sourceId, url, title, retrieved_at: new Date() },
  });
}

async function existingChipset(
  prisma: PrismaClient,
  record: SnapdragonSourceRecord,
) {
  return prisma.chipsets.findFirst({
    // A marketed name can cover several silicon SKUs (for example APQ/MSM
    // regional modem variants). Model code is the stable identity and avoids
    // collapsing those distinct chips into one catalog row.
    where: { model_code: record.modelCode },
    include: {
      chipset_cpu_links: { where: { is_primary: true }, take: 1 },
      chipset_gpu_links: { where: { is_primary: true }, take: 1 },
      chipset_npu_links: { where: { is_primary: true }, take: 1 },
      chipset_modem_links: { where: { is_primary: true }, take: 1 },
    },
  });
}

function chipsetDescription(
  record: SnapdragonSourceRecord,
  parsed: ParsedRecord,
) {
  return [
    `${record.name} thuộc ${record.series}, mã silicon ${record.modelCode}.`,
    parsed.process ? `Tiến trình/fab theo nguồn: ${parsed.process}.` : null,
    "Dữ liệu mô-đun được trích từ các cột CPU, GPU, DSP/NPU và modem của bảng nguồn; DSP Hexagon đời cũ được biểu diễn ở lớp NPU với cờ dedicated_npu=false.",
    `Thông số thô đối chiếu: ${parsed.rawSummary}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function cpuData(raw: string | null, isFallback: boolean) {
  const cores = parseCoreCount(raw);
  const frequency = parseMhz(raw);
  const coreTypes = cpuCoreTypes(raw);
  return {
    core_count: cores,
    thread_count: cores,
    big_little: raw
      ? /(?:\d+\s*\+\s*\d+\s*cores?|\d+\s*[×x].*?\+\s*\d+\s*[×x]|big\.LITTLE|Prime|Gold|Silver)/i.test(
          raw,
        )
      : null,
    isa_name: raw
      ? /ARMv9/i.test(raw)
        ? "ARMv9"
        : /ARMv8/i.test(raw)
          ? "ARMv8"
          : /ARMv7/i.test(raw)
            ? "ARMv7"
            : /ARMv6/i.test(raw)
              ? "ARMv6"
              : null
      : null,
    microarchitecture: raw ? compact(raw, 120) : null,
    core_type: coreTypes.length ? compact(coreTypes.join(" / "), 58) : null,
    max_frequency_mhz: frequency,
    ...parseCacheData(raw),
    supports_64bit: raw
      ? /ARMv8|ARMv9|Cortex-A(?:5[3-9]|[6-9]\d)|Oryon/i.test(raw)
      : null,
    description: isFallback
      ? "CPU tồn tại trong SoC Snapdragon này, nhưng nguồn tổng hợp không công bố cấu hình CPU tách riêng cho SKU; không suy đoán số lõi hay xung."
      : `CPU của Snapdragon, nguồn công bố: ${raw}.`,
  };
}

function gpuData(raw: string | null, isFallback: boolean) {
  const gflops = raw?.match(/(\d+(?:\.\d+)?)\s*GFLOP/i);
  const pipelines = raw?.match(/(\d+)\s*pipelines?/i);
  const shaders = raw?.match(/(\d+)\s*(?:shading units|shaders)/i);
  return {
    shader_units: shaders ? Number(shaders[1]) : null,
    compute_units: pipelines ? Number(pipelines[1]) : null,
    clock_mhz: parseMhz(raw),
    fp32_gflops: gflops ? Number(gflops[1]) : null,
    ray_tracing_support: raw && /ray tracing/i.test(raw) ? true : null,
    gpu_generation: gpuModel(raw),
    description: isFallback
      ? "Khối đồ họa tồn tại trong SoC Snapdragon này, nhưng nguồn tổng hợp không công bố GPU tách riêng cho SKU; không suy đoán tên GPU hoặc xung."
      : `GPU của Snapdragon, nguồn công bố: ${raw}.`,
  };
}

function npuData(raw: string) {
  const tops = raw.match(/(\d+(?:\.\d+)?)\s*TOPS/i);
  const dedicated = /\b(?:NPU|AI Engine|Tensor)\b/i.test(raw);
  return {
    // The schema intentionally forbids a TOPS claim for a non-dedicated DSP.
    // Retain that source figure in the description instead of misclassifying the DSP.
    tops: dedicated && tops ? Number(tops[1]) : null,
    dedicated_npu: dedicated,
    dsp_name: compact(raw, 120),
    ai_engine_version: dedicated ? "Qualcomm AI Engine / Hexagon" : null,
    tensor_accelerator: /Tensor/i.test(raw)
      ? "Hexagon Tensor Accelerator"
      : null,
    description: `${dedicated ? "Bộ xử lý AI" : "DSP Hexagon"} của Snapdragon: ${raw}. Những DSP đời trước không được mô tả là NPU chuyên dụng.`,
  };
}

function modemData(raw: string) {
  const is5g = /\b(?:5G|NR)\b/i.test(raw);
  const lteCategory = raw.match(/LTE\s*Cat\s*(\d+)/i);
  return {
    max_downlink_mbps: parseThroughput(raw, "download"),
    max_uplink_mbps: parseThroughput(raw, "upload"),
    supports_mmwave: /mmWave/i.test(raw),
    supports_satellite: /satellite/i.test(raw),
    supported_5g_modes: is5g
      ? /mmWave/i.test(raw)
        ? "5G NR Sub-6 và mmWave"
        : "5G NR / Sub-6 theo thông số nguồn"
      : null,
    lte_category: lteCategory ? `LTE Cat ${lteCategory[1]}` : null,
    supports_5g_nr: is5g,
    carrier_aggregation: /carrier aggregation|CA\b/i.test(raw),
    supported_technologies: compact(raw, 290),
    description: `Modem tích hợp theo thông số Snapdragon: ${raw}.`,
  };
}

async function linkComponent(
  prisma: PrismaClient,
  kind: ComponentKind,
  chipsetId: string,
  existingId: string | undefined,
  record: SnapdragonSourceRecord,
  raw: string | null,
  sourceUrl: string,
  wasInherited: boolean,
  moduleContext: ModuleSeedContext,
) {
  if (kind === "npu" && !raw) return null;
  if (kind === "modem" && !raw) return null;

  const modelPrefix = slugify(`qualcomm-${record.modelCode}`);
  const isFallback = !raw;
  const moduleName = isFallback
    ? `Qualcomm ${record.modelCode} ${kind.toUpperCase()} (not disclosed)`
    : `Qualcomm ${record.modelCode} ${kind.toUpperCase()} — ${compact(raw, 95)}`;

  if (kind === "cpu") {
    const data = {
      manufacturer_org_id: moduleContext.qualcommOrganizationId,
      architecture_id: raw ? moduleContext.armArchitectureId : null,
      name: compact(moduleName, 158),
      slug: `${modelPrefix}-cpu`,
      ...cpuData(raw, isFallback),
      ...cpuDetailOverrides(record),
    };
    const cpu = existingId
      ? await prisma.cpus.update({ where: { id: existingId }, data })
      : await prisma.cpus.upsert({
          where: { slug: data.slug },
          update: data,
          create: data,
        });
    await prisma.chipset_cpu_links.upsert({
      where: { chipset_id_cpu_id: { chipset_id: chipsetId, cpu_id: cpu.id } },
      update: { is_primary: true },
      create: { chipset_id: chipsetId, cpu_id: cpu.id, is_primary: true },
    });
    const clusters = parseCpuClusters(raw);
    for (const [index, cluster] of clusters.entries()) {
      await prisma.cpu_clusters.upsert({
        where: {
          cpu_id_cluster_order: {
            cpu_id: cpu.id,
            cluster_order: index,
          },
        },
        update: {
          cluster_name: `Cluster ${index + 1}`,
          core_microarchitecture: cluster.microarchitecture,
          core_count: cluster.coreCount,
          clock_ghz: cluster.clockGhz,
        },
        create: {
          cpu_id: cpu.id,
          cluster_name: `Cluster ${index + 1}`,
          core_microarchitecture: cluster.microarchitecture,
          core_count: cluster.coreCount,
          clock_ghz: cluster.clockGhz,
          cluster_order: index,
        },
      });
    }
    const populatedCpuFields = fieldStatus(data, CPU_FIELDS);
    if (clusters.length) populatedCpuFields.add("clusters");
    await seedCoverage(
      prisma,
      "cpu",
      cpu.id,
      CPU_FIELDS,
      populatedCpuFields,
      cpuGpuSourceUrl(record),
      wasInherited,
    );
    return { id: cpu.id, sourceUrl, wasInherited };
  }

  if (kind === "gpu") {
    const data = {
      manufacturer_org_id: moduleContext.qualcommOrganizationId,
      architecture_id: /\bAdreno\b/i.test(raw ?? "")
        ? moduleContext.adrenoArchitectureId
        : null,
      name: compact(moduleName, 158),
      slug: `${modelPrefix}-gpu`,
      ...gpuData(raw, isFallback),
      ...gpuDetailOverrides(record),
    };
    const gpu = existingId
      ? await prisma.gpus.update({ where: { id: existingId }, data })
      : await prisma.gpus.upsert({
          where: { slug: data.slug },
          update: data,
          create: data,
        });
    await prisma.chipset_gpu_links.upsert({
      where: { chipset_id_gpu_id: { chipset_id: chipsetId, gpu_id: gpu.id } },
      update: { is_primary: true },
      create: { chipset_id: chipsetId, gpu_id: gpu.id, is_primary: true },
    });
    await seedCoverage(
      prisma,
      "gpu",
      gpu.id,
      GPU_FIELDS,
      fieldStatus(data, GPU_FIELDS),
      cpuGpuSourceUrl(record),
      wasInherited,
    );
    return { id: gpu.id, sourceUrl, wasInherited };
  }

  if (kind === "npu") {
    const data = {
      manufacturer_org_id: moduleContext.qualcommOrganizationId,
      name: compact(moduleName, 158),
      slug: `${modelPrefix}-hexagon`,
      ...npuData(raw!),
    };
    const npu = existingId
      ? await prisma.npus.update({ where: { id: existingId }, data })
      : await prisma.npus.upsert({
          where: { slug: data.slug },
          update: data,
          create: data,
        });
    await prisma.chipset_npu_links.upsert({
      where: { chipset_id_npu_id: { chipset_id: chipsetId, npu_id: npu.id } },
      update: { is_primary: true },
      create: { chipset_id: chipsetId, npu_id: npu.id, is_primary: true },
    });
    await seedCoverage(
      prisma,
      "npu",
      npu.id,
      NPU_FIELDS,
      fieldStatus(data, NPU_FIELDS),
      sourceUrl,
      wasInherited,
    );
    return { id: npu.id, sourceUrl, wasInherited };
  }

  const data = {
    manufacturer_org_id: moduleContext.qualcommOrganizationId,
    name: compact(moduleName, 158),
    slug: `${modelPrefix}-modem`,
    ...modemData(raw!),
  };
  const modem = existingId
    ? await prisma.modems.update({ where: { id: existingId }, data })
    : await prisma.modems.upsert({
        where: { slug: data.slug },
        update: data,
        create: data,
      });
  await prisma.chipset_modem_links.upsert({
    where: {
      chipset_id_modem_id: { chipset_id: chipsetId, modem_id: modem.id },
    },
    update: { is_primary: true, is_integrated: !/external/i.test(raw!) },
    create: {
      chipset_id: chipsetId,
      modem_id: modem.id,
      is_primary: true,
      is_integrated: !/external/i.test(raw!),
    },
  });
  await seedCoverage(
    prisma,
    "modem",
    modem.id,
    MODEM_FIELDS,
    fieldStatus(data, MODEM_FIELDS),
    sourceUrl,
    wasInherited,
  );
  return { id: modem.id, sourceUrl, wasInherited };
}

export async function seedSnapdragonCatalog(prisma: PrismaClient) {
  const qualcomm = await prisma.organizations.upsert({
    where: { slug: "qualcomm" },
    update: { is_active: true, deleted_at: null },
    create: {
      name: "Qualcomm",
      slug: "qualcomm",
      short_name: "Qualcomm",
      country_code: "US",
      website_url: "https://www.qualcomm.com",
      description:
        "Qualcomm Technologies designs Snapdragon platforms, cellular modems and connectivity solutions.",
    },
  });
  const family = await prisma.technology_families.upsert({
    where: { slug: "qualcomm-snapdragon" },
    update: {
      name: "Qualcomm Snapdragon",
      family_type: "soc_family",
      vendor_org_id: qualcomm.id,
    },
    create: {
      name: "Qualcomm Snapdragon",
      slug: "qualcomm-snapdragon",
      family_type: "soc_family",
      vendor_org_id: qualcomm.id,
      description:
        "Qualcomm Snapdragon systems-on-chips and adjacent Snapdragon platform families.",
    },
  });
  const armArchitecture = await prisma.architectures.upsert({
    where: { slug: "arm" },
    update: {
      name: "ARM",
      architecture_type: "cpu_isa",
      vendor_org_id: null,
    },
    create: {
      name: "ARM",
      slug: "arm",
      architecture_type: "cpu_isa",
      description:
        "ARM instruction-set architecture used by the CPU complexes in Snapdragon mobile and compute platforms.",
    },
  });
  const adrenoArchitecture = await prisma.architectures.upsert({
    where: { slug: "qualcomm-adreno" },
    update: {
      name: "Qualcomm Adreno",
      architecture_type: "gpu",
      vendor_org_id: qualcomm.id,
    },
    create: {
      name: "Qualcomm Adreno",
      slug: "qualcomm-adreno",
      architecture_type: "gpu",
      vendor_org_id: qualcomm.id,
      description:
        "Qualcomm Adreno graphics architecture used by Snapdragon SoCs and platform variants.",
    },
  });
  const moduleContext: ModuleSeedContext = {
    qualcommOrganizationId: qualcomm.id,
    armArchitectureId: armArchitecture.id,
    adrenoArchitectureId: adrenoArchitecture.id,
  };
  const wikipedia = await prisma.sources.upsert({
    where: { slug: "wikipedia-snapdragon-socs" },
    update: {
      name: "Wikipedia — Snapdragon systems on chips",
      source_type: "technical_reference",
      base_url: "https://en.wikipedia.org",
      trust_level: 3,
    },
    create: {
      name: "Wikipedia — Snapdragon systems on chips",
      slug: "wikipedia-snapdragon-socs",
      source_type: "technical_reference",
      base_url: "https://en.wikipedia.org",
      trust_level: 3,
      description:
        "Chronological cross-reference used to enumerate Snapdragon SKU rows and disclosed component fields.",
    },
  });
  const qualcommSource = await prisma.sources.upsert({
    where: { slug: "qualcomm-product-pages" },
    update: {
      name: "Qualcomm product pages",
      source_type: "official",
      base_url: "https://www.qualcomm.com",
      trust_level: 5,
    },
    create: {
      name: "Qualcomm product pages",
      slug: "qualcomm-product-pages",
      source_type: "official",
      base_url: "https://www.qualcomm.com",
      trust_level: 5,
      description:
        "Official Qualcomm Snapdragon platform specifications and product briefs.",
    },
  });
  const nanoreview = await prisma.sources.upsert({
    where: { slug: "nanoreview" },
    update: {
      name: "NanoReview SoC database",
      source_type: "technical_database",
      base_url: "https://nanoreview.net",
      trust_level: 4,
    },
    create: {
      name: "NanoReview SoC database",
      slug: "nanoreview",
      source_type: "technical_database",
      base_url: "https://nanoreview.net",
      trust_level: 4,
      description:
        "Independent SoC specifications and benchmark database used to cross-check disclosed Snapdragon 8 Gen 3 CPU and GPU topology.",
    },
  });
  await Promise.all([
    seedCitation(
      prisma,
      wikipedia.id,
      SNAPDRAGON_CATALOG_SOURCE_URL,
      "List of Qualcomm Snapdragon systems on chips",
    ),
    seedCitation(
      prisma,
      qualcommSource.id,
      QUALCOMM_8_ELITE_SOURCE_URL,
      "Snapdragon 8 Elite Mobile Platform",
    ),
    seedCitation(
      prisma,
      qualcommSource.id,
      QUALCOMM_8_GEN_3_SOURCE_URL,
      "Snapdragon 8 Gen 3 Mobile Platform",
    ),
    seedCitation(
      prisma,
      nanoreview.id,
      NANOREVIEW_8_GEN_3_SOURCE_URL,
      "Qualcomm Snapdragon 8 Gen 3: benchmarks and specifications",
    ),
  ]);

  const contexts = new Map<number, HardwareContext>();
  let seeded = 0;
  let cpuLinks = 0;
  let gpuLinks = 0;
  let npuLinks = 0;
  let modemLinks = 0;

  for (const record of SNAPDRAGON_SOURCE_RECORDS) {
    const parsed = parseRecord(record);
    const sourceUrl = sourceUrlFor(record);
    const context = contexts.get(record.sourceTable) ?? {};
    const inheritedCpu = !parsed.cpu && context.cpu ? context.cpu : undefined;
    const inheritedGpu = !parsed.gpu && context.gpu ? context.gpu : undefined;
    const inheritedNpu = !parsed.npu && context.npu ? context.npu : undefined;
    const inheritedModem =
      !parsed.modem && context.modem ? context.modem : undefined;
    const previous = await existingChipset(prisma, record);
    const chipsetData = {
      manufacturer_org_id: qualcomm.id,
      technology_family_id: family.id,
      chip_kind: "soc",
      name: previous?.name ?? record.name,
      model_code: record.modelCode,
      supports_64bit: parsed.cpu
        ? /ARMv8|ARMv9|Cortex-A(?:5[3-9]|[6-9]\d)|Oryon/i.test(parsed.cpu)
        : null,
      integrated_5g: parsed.modem
        ? /\b5G\b/i.test(parsed.modem)
        : inheritedModem
          ? true
          : false,
      integrated_wifi: /\b(?:Wi-?Fi|802\.11)\b/i.test(parsed.rawSummary),
      max_camera_mp: parsed.maxCameraMp,
      announcement_date: parsed.announcementDate,
      description: chipsetDescription(record, parsed),
      deleted_at: null,
    };
    const chipset = previous
      ? await prisma.chipsets.update({
          where: { id: previous.id },
          data: chipsetData,
          include: {
            chipset_cpu_links: { where: { is_primary: true }, take: 1 },
            chipset_gpu_links: { where: { is_primary: true }, take: 1 },
            chipset_npu_links: { where: { is_primary: true }, take: 1 },
            chipset_modem_links: { where: { is_primary: true }, take: 1 },
          },
        })
      : await prisma.chipsets.upsert({
          where: {
            slug: slugify(`qualcomm-${record.name}-${record.modelCode}`),
          },
          update: chipsetData,
          create: {
            ...chipsetData,
            slug: slugify(`qualcomm-${record.name}-${record.modelCode}`),
          },
          include: {
            chipset_cpu_links: { where: { is_primary: true }, take: 1 },
            chipset_gpu_links: { where: { is_primary: true }, take: 1 },
            chipset_npu_links: { where: { is_primary: true }, take: 1 },
            chipset_modem_links: { where: { is_primary: true }, take: 1 },
          },
        });

    const chipsetFields = fieldStatus(chipsetData, CHIPSET_FIELDS);
    chipsetFields.add("cpus");
    chipsetFields.add("gpus");
    if (parsed.npu || inheritedNpu || chipset.chipset_npu_links.length)
      chipsetFields.add("npus");
    if (parsed.modem || inheritedModem || chipset.chipset_modem_links.length)
      chipsetFields.add("modems");
    await seedCoverage(
      prisma,
      "chipset",
      chipset.id,
      CHIPSET_FIELDS,
      chipsetFields,
      sourceUrl,
    );

    const cpu = inheritedCpu
      ? inheritedCpu
      : await linkComponent(
          prisma,
          "cpu",
          chipset.id,
          chipset.chipset_cpu_links[0]?.cpu_id,
          record,
          parsed.cpu,
          sourceUrl,
          false,
          moduleContext,
        );
    if (inheritedCpu) {
      await prisma.chipset_cpu_links.upsert({
        where: {
          chipset_id_cpu_id: {
            chipset_id: chipset.id,
            cpu_id: inheritedCpu.id,
          },
        },
        update: { is_primary: true },
        create: {
          chipset_id: chipset.id,
          cpu_id: inheritedCpu.id,
          is_primary: true,
        },
      });
    }
    if (cpu) {
      contexts.set(record.sourceTable, {
        ...contexts.get(record.sourceTable),
        cpu,
      });
      cpuLinks += 1;
    }

    const gpu = inheritedGpu
      ? inheritedGpu
      : await linkComponent(
          prisma,
          "gpu",
          chipset.id,
          chipset.chipset_gpu_links[0]?.gpu_id,
          record,
          parsed.gpu,
          sourceUrl,
          false,
          moduleContext,
        );
    if (inheritedGpu) {
      await prisma.chipset_gpu_links.upsert({
        where: {
          chipset_id_gpu_id: {
            chipset_id: chipset.id,
            gpu_id: inheritedGpu.id,
          },
        },
        update: { is_primary: true },
        create: {
          chipset_id: chipset.id,
          gpu_id: inheritedGpu.id,
          is_primary: true,
        },
      });
    }
    if (gpu) {
      contexts.set(record.sourceTable, {
        ...contexts.get(record.sourceTable),
        gpu,
      });
      gpuLinks += 1;
    }

    const npu = inheritedNpu
      ? inheritedNpu
      : await linkComponent(
          prisma,
          "npu",
          chipset.id,
          chipset.chipset_npu_links[0]?.npu_id,
          record,
          parsed.npu,
          sourceUrl,
          false,
          moduleContext,
        );
    if (inheritedNpu) {
      await prisma.chipset_npu_links.upsert({
        where: {
          chipset_id_npu_id: {
            chipset_id: chipset.id,
            npu_id: inheritedNpu.id,
          },
        },
        update: { is_primary: true },
        create: {
          chipset_id: chipset.id,
          npu_id: inheritedNpu.id,
          is_primary: true,
        },
      });
    }
    if (npu) {
      contexts.set(record.sourceTable, {
        ...contexts.get(record.sourceTable),
        npu,
      });
      npuLinks += 1;
    }

    const modem = inheritedModem
      ? inheritedModem
      : await linkComponent(
          prisma,
          "modem",
          chipset.id,
          chipset.chipset_modem_links[0]?.modem_id,
          record,
          parsed.modem,
          sourceUrl,
          false,
          moduleContext,
        );
    if (inheritedModem) {
      await prisma.chipset_modem_links.upsert({
        where: {
          chipset_id_modem_id: {
            chipset_id: chipset.id,
            modem_id: inheritedModem.id,
          },
        },
        update: { is_primary: true, is_integrated: true },
        create: {
          chipset_id: chipset.id,
          modem_id: inheritedModem.id,
          is_primary: true,
          is_integrated: true,
        },
      });
    }
    if (modem) {
      contexts.set(record.sourceTable, {
        ...contexts.get(record.sourceTable),
        modem,
      });
      modemLinks += 1;
    }
    seeded += 1;
  }

  return {
    records: SNAPDRAGON_SOURCE_RECORDS.length,
    chipsets: seeded,
    cpuLinks,
    gpuLinks,
    npuLinks,
    modemLinks,
    sources: 3,
  };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await seedSnapdragonCatalog(prisma);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
