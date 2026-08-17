import { Injectable, Logger } from "@nestjs/common";
import {
  type AiCitation,
  type RagChunk,
  tokenize,
  trimText,
} from "@spechub/ai-core";
import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import {
  HardwareCatalogService,
  type HardwareDeviceUsage,
  type HardwareModuleDetail,
  type HardwareModuleKind,
} from "../hardware-catalog/hardware-catalog.service";
import { AiProviderService } from "./ai-provider.service";
import { type ResearchHardwareDto } from "./dto/research-hardware.dto";

const SOURCE_SELECT = {
  id: true,
  name: true,
  slug: true,
  source_type: true,
  base_url: true,
  trust_level: true,
} as const;

const DEVICE_BENCHMARK_SELECT = {
  id: true,
  device_variant_id: true,
  score: true,
  subscore_name: true,
  tested_at: true,
  benchmark: {
    select: {
      id: true,
      name: true,
      slug: true,
      benchmark_type: true,
      target_type: true,
      version: true,
      higher_is_better: true,
      unit: { select: { name: true, symbol: true } },
    },
  },
  benchmark_run: {
    select: {
      id: true,
      tested_at: true,
      test_environment_note: true,
      ambient_temp_c: true,
      os_version: true,
      app_version: true,
      driver_version: true,
      is_thermal_throttled: true,
      power_mode: true,
      source: { select: SOURCE_SELECT },
      citation: {
        select: {
          url: true,
          title: true,
        },
      },
    },
  },
  source: { select: SOURCE_SELECT },
} satisfies Prisma.device_variant_benchmarksSelect;

const MODULE_SCORE_SELECT = {
  device_variant_id: true,
  score: true,
  score_source: true,
  score_version: true,
  rationale: true,
  factors: true,
} satisfies Prisma.variant_module_scoresSelect;

type DeviceBenchmark = Prisma.device_variant_benchmarksGetPayload<{
  select: typeof DEVICE_BENCHMARK_SELECT;
}>;

type ModuleScore = Prisma.variant_module_scoresGetPayload<{
  select: typeof MODULE_SCORE_SELECT;
}>;

type DeviceCandidate = {
  variantId: string;
  variantName: string;
  model: HardwareDeviceUsage["device_model"];
};

type PreparedBenchmark = {
  record: DeviceBenchmark;
  groupKey: string;
  comparisonSize: number;
  relativeScore: number | null;
};

type EvidenceStatus = "measured" | "modeled" | "partial" | "insufficient_data";
type EvidenceQuality = "strong" | "moderate" | "limited";

const SCORING_VERSION = "hardware-effectiveness-v3";

const MODULE_BENCHMARK_TERMS: Record<HardwareModuleKind, string[]> = {
  chipset: [
    "chipset",
    "soc",
    "system performance",
    "overall performance",
    "cpu",
    "gpu",
  ],
  cpu: ["cpu", "processor", "compute", "single core", "multi core"],
  gpu: ["gpu", "graphics", "gaming", "rendering", "frame rate"],
  npu: ["npu", "neural", "artificial intelligence", "machine learning", "ml"],
  modem: ["modem", "cellular", "mobile network", "4g", "5g", "connectivity"],
  "memory-standard": ["memory", "ram", "bandwidth", "memory latency"],
  "storage-standard": [
    "storage",
    "disk",
    "flash",
    "sequential read",
    "sequential write",
    "random read",
    "random write",
  ],
  "operating-system": ["operating system", "system", "os performance"],
  camera: ["camera", "photo", "video", "imaging"],
  display: ["display", "screen", "brightness", "color accuracy", "pwm"],
  battery: [
    "battery",
    "endurance",
    "charging",
    "power efficiency",
    "energy efficiency",
  ],
};

@Injectable()
export class HardwareResearchService {
  private readonly logger = new Logger(HardwareResearchService.name);

  constructor(
    private readonly hardwareCatalogService: HardwareCatalogService,
    private readonly aiProvider: AiProviderService,
    private readonly prisma: PrismaService,
  ) {}

  async research(kind: string, slug: string, dto: ResearchHardwareDto) {
    const hardwareModule = await this.hardwareCatalogService.findByKindAndSlug(
      kind,
      slug,
    );
    const question = dto.question?.trim() || null;
    const candidates = this.deviceCandidates(hardwareModule.devices);
    const [benchmarkRecords, moduleScores] = candidates.length
      ? await Promise.all([
          this.prisma.device_variant_benchmarks.findMany({
            where: {
              device_variant_id: {
                in: candidates.map((candidate) => candidate.variantId),
              },
            },
            select: DEVICE_BENCHMARK_SELECT,
            orderBy: [{ tested_at: "desc" }, { id: "asc" }],
          }),
          this.prisma.variant_module_scores.findMany({
            where: {
              device_variant_id: {
                in: candidates.map((candidate) => candidate.variantId),
              },
              module_kind: hardwareModule.kind,
              module_id: hardwareModule.id,
            },
            select: MODULE_SCORE_SELECT,
          }),
        ])
      : [[], []];
    const relevantRecords = benchmarkRecords.filter((record) =>
      this.isRelevantBenchmark(hardwareModule.kind, record),
    );
    const preparedRecords = this.prepareBenchmarkGroups(relevantRecords);
    const moduleScoreByVariant = new Map(
      moduleScores.map((score) => [score.device_variant_id, score]),
    );
    const assessments = this.buildAssessments(
      candidates,
      preparedRecords,
      moduleScoreByVariant,
    );
    const measuredAssessments = assessments
      .filter((assessment) => assessment.status === "measured")
      .sort(
        (left, right) =>
          (right.effectiveness_score ?? 0) - (left.effectiveness_score ?? 0) ||
          left.device.name.localeCompare(right.device.name),
      );
    const modeledAssessments = assessments
      .filter((assessment) => assessment.status === "modeled")
      .sort(
        (left, right) =>
          (right.effectiveness_score ?? 0) - (left.effectiveness_score ?? 0) ||
          left.device.name.localeCompare(right.device.name),
      );
    const rankedAssessments = measuredAssessments.length
      ? measuredAssessments
      : modeledAssessments;

    rankedAssessments.forEach((assessment, index) => {
      assessment.rank = index + 1;
    });

    const orderedAssessments = [
      ...measuredAssessments,
      ...modeledAssessments,
      ...assessments
        .filter((assessment) => assessment.status === "partial")
        .sort((left, right) =>
          left.device.name.localeCompare(right.device.name),
        ),
      ...assessments
        .filter((assessment) => assessment.status === "insufficient_data")
        .sort((left, right) =>
          left.device.name.localeCompare(right.device.name),
        ),
    ];
    const comparisonGroups = new Set(
      preparedRecords
        .filter((record) => record.relativeScore !== null)
        .map((record) => record.groupKey),
    );
    const status: EvidenceStatus = comparisonGroups.size
      ? "measured"
      : moduleScores.length
        ? "modeled"
        : relevantRecords.length
          ? "partial"
          : "insufficient_data";
    const benchmarkedDeviceCount = new Set(
      relevantRecords.map((record) => record.device_variant_id),
    ).size;
    const comparableDeviceCount = new Set(
      preparedRecords
        .filter((record) => record.relativeScore !== null)
        .map((record) => record.record.device_variant_id),
    ).size;
    const modeledDeviceCount = new Set(
      moduleScores.map((score) => score.device_variant_id),
    ).size;
    const chunks = this.buildEvidenceChunks(
      hardwareModule,
      measuredAssessments,
    );
    const citations = chunks.map((chunk) => this.toCitation(chunk));
    const generated =
      question && measuredAssessments.length
        ? await this.generateExplanation(question, chunks, citations)
        : null;
    const summary =
      generated?.answer ??
      this.composeFallbackSummary(
        hardwareModule,
        status,
        rankedAssessments,
        candidates.length,
        benchmarkedDeviceCount,
        comparisonGroups.size,
      );

    return {
      data: {
        module: {
          kind: hardwareModule.kind,
          id: hardwareModule.id,
          name: hardwareModule.name,
          slug: hardwareModule.slug,
        },
        question,
        assessment_status: status,
        methodology: {
          label: "Benchmark sử dụng mô-đun trên từng thiết bị",
          description:
            "Giữ nguyên điểm gốc của từng benchmark và chỉ đối chiếu các kết quả cùng bài đo, phiên bản và hạng mục. Dữ liệu cấu hình chỉ bổ sung ngữ cảnh, không thay thế benchmark.",
          criteria: [
            {
              key: "device_outcome",
              label: "Kết quả trên thiết bị",
              requirement:
                "Dùng benchmark của phiên bản thiết bị, không dùng số lượng sản phẩm hay độ mới làm điểm hiệu quả.",
            },
            {
              key: "configuration_fallback",
              label: "Ngữ cảnh cấu hình khi thiếu phép đo",
              requirement:
                "Mô tả độ đầy đủ tích hợp, RAM/lưu trữ và quan hệ thiết bị–mô-đun; không tạo điểm hiệu năng thay thế.",
            },
            {
              key: "comparable_conditions",
              label: "Điều kiện có thể đối chiếu",
              requirement:
                "Cùng benchmark, subscore, phiên bản ứng dụng và giao thức thử. Kết quả tổng hợp chỉ được đối chiếu với cùng bộ dữ liệu tổng hợp; phép đo đơn lẻ cần ghi nhiệt độ và chế độ nguồn.",
            },
            {
              key: "score_direction",
              label: "Đúng chiều điểm",
              requirement:
                "Tôn trọng cấu hình higher_is_better của từng benchmark trước khi chuẩn hóa tương đối.",
            },
            {
              key: "thermal_context",
              label: "Ổn định nhiệt",
              requirement:
                "Cảnh báo riêng nếu lần đo bị thermal throttling; không che thông tin này trong điểm tổng.",
            },
          ],
        },
        summary,
        coverage: {
          linked_device_count: candidates.length,
          benchmarked_device_count: benchmarkedDeviceCount,
          comparable_device_count: comparableDeviceCount,
          modeled_device_count: modeledDeviceCount,
          benchmark_result_count: relevantRecords.length,
          comparable_metric_count: comparisonGroups.size,
        },
        device_assessments: orderedAssessments,
        compare_variant_ids: rankedAssessments
          .slice(0, 4)
          .map((assessment) => assessment.device.variant_id),
        evidence: citations,
        missing_data: this.missingData(
          candidates.length,
          benchmarkedDeviceCount,
          comparisonGroups.size,
          preparedRecords,
        ),
        disclaimer:
          "Nhãn “Đo thực tế” là chỉ số đầu ra tương đối trong nhóm đo tương thích. Nhãn “Cấu hình” là điểm tham chiếu từ dữ liệu tích hợp đã lưu, không phải phép đo hiệu năng hay hiệu suất điện năng.",
      },
      meta: {
        source: "hybrid_module_scores",
        scoring_version: SCORING_VERSION,
        generated_by: generated ? "hybrid" : "rule_engine",
        rag_provider: generated?.provider ?? "local",
        model_name: generated?.modelName ?? this.aiProvider.ragModelName,
      },
    };
  }

  private deviceCandidates(devices: HardwareDeviceUsage[]): DeviceCandidate[] {
    const candidates = new Map<string, DeviceCandidate>();

    for (const device of devices) {
      if (candidates.has(device.variant_id)) continue;
      candidates.set(device.variant_id, {
        variantId: device.variant_id,
        variantName: device.variant_name,
        model: device.device_model,
      });
    }

    return [...candidates.values()];
  }

  private isRelevantBenchmark(
    kind: HardwareModuleKind,
    record: DeviceBenchmark,
  ) {
    const searchableTokens = new Set(
      tokenize(
        [
          record.benchmark.name,
          record.benchmark.slug,
          record.benchmark.benchmark_type,
          record.benchmark.target_type,
          record.subscore_name,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    );
    const searchableText = [...searchableTokens].join(" ");

    return MODULE_BENCHMARK_TERMS[kind].some((term) => {
      const termTokens = tokenize(term);
      return termTokens.length === 1
        ? searchableTokens.has(termTokens[0] ?? "")
        : searchableText.includes(termTokens.join(" "));
    });
  }

  private prepareBenchmarkGroups(
    records: DeviceBenchmark[],
  ): PreparedBenchmark[] {
    const groups = new Map<string, Map<string, DeviceBenchmark>>();

    for (const record of records) {
      const groupKey = this.comparisonGroupKey(record);
      const group = groups.get(groupKey) ?? new Map<string, DeviceBenchmark>();
      const existing = group.get(record.device_variant_id);
      if (!existing || this.testedTime(record) > this.testedTime(existing)) {
        group.set(record.device_variant_id, record);
      }
      groups.set(groupKey, group);
    }

    return [...groups.entries()].flatMap(([groupKey, group]) => {
      const groupRecords = [...group.values()];
      const comparisonSize = groupRecords.length;
      const scores = groupRecords.map((record) => Number(record.score));
      const hasComparableConditions = groupRecords.every((record) =>
        this.hasRecordedConditions(record),
      );

      return groupRecords.map((record) => ({
        record,
        groupKey,
        comparisonSize,
        relativeScore:
          comparisonSize >= 2 && hasComparableConditions
            ? this.relativeScore(
                Number(record.score),
                scores,
                record.benchmark.higher_is_better,
              )
            : null,
      }));
    });
  }

  private comparisonGroupKey(record: DeviceBenchmark) {
    const run = record.benchmark_run;
    const condition = (value: string | null | undefined) =>
      tokenize(value ?? "").join("-") || "unknown";
    const ambientTemp =
      run?.ambient_temp_c !== null && run?.ambient_temp_c !== undefined
        ? Number(run.ambient_temp_c).toFixed(1)
        : "unknown";

    return [
      record.benchmark.id,
      condition(record.subscore_name),
      `app:${condition(run?.app_version)}`,
      `power:${condition(run?.power_mode)}`,
      `ambient:${ambientTemp}`,
      `environment:${condition(run?.test_environment_note)}`,
    ].join("|");
  }

  private testedTime(record: DeviceBenchmark) {
    const value = record.tested_at ?? record.benchmark_run?.tested_at;
    return value ? value.getTime() : 0;
  }

  private relativeScore(
    score: number,
    scores: number[],
    higherIsBetter: boolean,
  ) {
    const best = higherIsBetter ? Math.max(...scores) : Math.min(...scores);
    const worst = higherIsBetter ? Math.min(...scores) : Math.max(...scores);

    if (best === worst) return 100;
    if (score > 0 && best > 0) {
      const ratio = higherIsBetter ? score / best : best / score;
      return this.roundScore(Math.max(0, Math.min(1, ratio)) * 100);
    }

    const position = higherIsBetter
      ? (score - worst) / (best - worst)
      : (worst - score) / (worst - best);
    return this.roundScore(50 + Math.max(0, Math.min(1, position)) * 50);
  }

  private buildAssessments(
    candidates: DeviceCandidate[],
    preparedRecords: PreparedBenchmark[],
    moduleScoreByVariant: Map<string, ModuleScore>,
  ) {
    return candidates.map((candidate) => {
      const moduleScore = moduleScoreByVariant.get(candidate.variantId) ?? null;
      const records = preparedRecords
        .filter(
          (prepared) =>
            prepared.record.device_variant_id === candidate.variantId,
        )
        .sort(
          (left, right) =>
            Number(right.relativeScore !== null) -
              Number(left.relativeScore !== null) ||
            left.record.benchmark.name.localeCompare(
              right.record.benchmark.name,
            ),
        );
      const comparableRecords = records.filter(
        (record) => record.relativeScore !== null,
      );
      const status: EvidenceStatus = comparableRecords.length
        ? "measured"
        : moduleScore
          ? "modeled"
          : records.length
            ? "partial"
            : "insufficient_data";
      const effectivenessScore = comparableRecords.length
        ? this.roundScore(
            comparableRecords.reduce(
              (sum, record) => sum + (record.relativeScore ?? 0),
              0,
            ) / comparableRecords.length,
          )
        : moduleScore
          ? Number(moduleScore.score)
          : null;
      const throttledCount = records.filter(
        (record) => record.record.benchmark_run?.is_thermal_throttled === true,
      ).length;
      const undocumentedConditionCount = records.filter(
        (record) => !this.hasRecordedConditions(record.record),
      ).length;

      return {
        rank: null as number | null,
        status,
        effectiveness_score: effectivenessScore,
        score_basis:
          status === "measured"
            ? ("benchmark" as const)
            : status === "modeled"
              ? ("configuration_model" as const)
              : ("none" as const),
        score_label:
          status === "measured"
            ? "Đo thực tế"
            : status === "modeled"
              ? "Cấu hình"
              : "Chưa có điểm",
        score_details: moduleScore
          ? {
              source: moduleScore.score_source,
              version: moduleScore.score_version,
              rationale: moduleScore.rationale,
              factors: moduleScore.factors,
            }
          : null,
        evidence_quality: this.evidenceQuality(comparableRecords),
        device: {
          variant_id: candidate.variantId,
          variant_name: candidate.variantName,
          id: candidate.model.id,
          name: candidate.model.name,
          slug: candidate.model.slug,
          generation_label: candidate.model.generation_label,
          release_date: candidate.model.release_date,
          product_line: candidate.model.product_family
            ? {
                id: candidate.model.product_family.id,
                name: candidate.model.product_family.name,
                slug: candidate.model.product_family.slug,
                brand: candidate.model.product_family.brand_org,
              }
            : null,
        },
        metrics: {
          benchmark_count: records.length,
          comparable_metric_count: comparableRecords.length,
          configuration_score_available: Boolean(moduleScore),
          throttled_result_count: throttledCount,
          undocumented_condition_count: undocumentedConditionCount,
        },
        benchmark_results: records.map((record) =>
          this.benchmarkResult(record),
        ),
        assessment: this.deviceAssessment(
          status,
          effectivenessScore,
          comparableRecords.length,
          moduleScore,
        ),
        trade_offs: this.tradeOffs(
          status,
          throttledCount,
          undocumentedConditionCount,
        ),
      };
    });
  }

  private benchmarkResult(prepared: PreparedBenchmark) {
    const record = prepared.record;
    const run = record.benchmark_run;
    const source = record.source ?? run?.source ?? null;
    const testedAt = record.tested_at ?? run?.tested_at ?? null;

    return {
      id: record.id,
      benchmark: {
        name: record.benchmark.name,
        slug: record.benchmark.slug,
        type: record.benchmark.benchmark_type,
        version: record.benchmark.version,
        subscore_name: record.subscore_name,
        unit: record.benchmark.unit,
        higher_is_better: record.benchmark.higher_is_better,
      },
      score: Number(record.score),
      relative_score: prepared.relativeScore,
      comparable: prepared.relativeScore !== null,
      comparison_size: prepared.comparisonSize,
      tested_at: testedAt?.toISOString().slice(0, 10) ?? null,
      conditions: {
        recorded: this.hasRecordedConditions(record),
        environment_note: run?.test_environment_note ?? null,
        ambient_temp_c:
          run?.ambient_temp_c !== null && run?.ambient_temp_c !== undefined
            ? Number(run.ambient_temp_c)
            : null,
        os_version: run?.os_version ?? null,
        app_version: run?.app_version ?? null,
        driver_version: run?.driver_version ?? null,
        power_mode: run?.power_mode ?? null,
        thermal_throttled: run?.is_thermal_throttled ?? null,
      },
      source: source
        ? {
            id: source.id,
            name: source.name,
            type: source.source_type,
            trust_level: source.trust_level,
            url: run?.citation?.url ?? source.base_url,
            citation_title: run?.citation?.title ?? null,
          }
        : null,
    };
  }

  private hasRecordedConditions(record: DeviceBenchmark) {
    const run = record.benchmark_run;

    if (
      run?.power_mode === "aggregate" &&
      run.app_version &&
      run.test_environment_note
    ) {
      return true;
    }

    return Boolean(
      run && run.app_version && run.power_mode && run.ambient_temp_c !== null,
    );
  }

  private evidenceQuality(records: PreparedBenchmark[]): EvidenceQuality {
    if (!records.length) return "limited";
    const documentedRatio =
      records.filter((record) => this.hasRecordedConditions(record.record))
        .length / records.length;
    const minimumComparisonSize = Math.min(
      ...records.map((record) => record.comparisonSize),
    );

    if (
      records.length >= 3 &&
      documentedRatio >= 0.75 &&
      minimumComparisonSize >= 3
    ) {
      return "strong";
    }
    if (
      records.length >= 2 ||
      (documentedRatio >= 0.5 && minimumComparisonSize >= 2)
    ) {
      return "moderate";
    }
    return "limited";
  }

  private deviceAssessment(
    status: EvidenceStatus,
    score: number | null,
    comparableMetricCount: number,
    moduleScore: ModuleScore | null,
  ) {
    if (status === "measured") {
      return `Có ${comparableMetricCount} hạng mục benchmark cùng chuẩn để đối chiếu; kết luận dựa trên điểm gốc của từng phép đo.`;
    }
    if (status === "modeled") {
      return (
        moduleScore?.rationale ??
        "Chưa có benchmark chung. Dữ liệu cấu hình chỉ được dùng để mô tả cách mô-đun được tích hợp, không tạo điểm hiệu năng."
      );
    }
    if (status === "partial") {
      return "Có kết quả đo riêng lẻ nhưng chưa có thiết bị đối chứng cùng benchmark và điều kiện thử nghiệm.";
    }
    return "Chưa có benchmark thiết bị liên quan đến mô-đun này, nên chưa thể đánh giá hiệu quả triển khai.";
  }

  private tradeOffs(
    status: EvidenceStatus,
    throttledCount: number,
    undocumentedConditionCount: number,
  ) {
    const tradeOffs: string[] = [];
    if (status === "modeled") {
      tradeOffs.push(
        "Chưa có nhóm benchmark đối chứng; điểm hiện tại phản ánh mức phù hợp cấu hình.",
      );
    } else if (status !== "measured") {
      tradeOffs.push("Không xếp hạng khi chưa có nhóm benchmark đối chứng.");
    }
    if (throttledCount) {
      tradeOffs.push(
        `${throttledCount} kết quả ghi nhận thermal throttling; cần xem riêng độ ổn định hiệu năng.`,
      );
    }
    if (undocumentedConditionCount) {
      tradeOffs.push(
        `${undocumentedConditionCount} kết quả chưa ghi đủ điều kiện thử nghiệm.`,
      );
    }
    return tradeOffs;
  }

  private buildEvidenceChunks(
    hardwareModule: HardwareModuleDetail,
    rankedAssessments: ReturnType<HardwareResearchService["buildAssessments"]>,
  ): RagChunk[] {
    const moduleChunk: RagChunk = {
      entityType: "hardware_module",
      entityId: hardwareModule.id,
      chunkIndex: 0,
      title: hardwareModule.name,
      slug: `${hardwareModule.kind}/${hardwareModule.slug}`,
      score: hardwareModule.research.completeness_percent / 100,
      chunkText: [
        `Module: ${hardwareModule.name}`,
        `Kind: ${hardwareModule.kind}`,
        `Linked device variants: ${hardwareModule.research.variant_count}.`,
        "Effectiveness requires comparable device-variant benchmarks; catalog coverage and release recency are not effectiveness evidence.",
      ].join("\n"),
    };

    const deviceChunks = rankedAssessments.map((assessment, index) => ({
      entityType: "device_variant" as const,
      entityId: assessment.device.variant_id,
      chunkIndex: index,
      title: `${assessment.device.name} · ${assessment.device.variant_name}`,
      slug: assessment.device.slug,
      score: (assessment.effectiveness_score ?? 0) / 100,
      chunkText: [
        `Device: ${assessment.device.name}.`,
        `Variant: ${assessment.device.variant_name}.`,
        `Comparable metrics: ${assessment.metrics.comparable_metric_count}.`,
        ...assessment.benchmark_results
          .filter((result) => result.comparable)
          .map(
            (result) =>
              `${result.benchmark.name}${result.benchmark.version ? ` ${result.benchmark.version}` : ""}${result.benchmark.subscore_name ? ` / ${result.benchmark.subscore_name}` : ""}: ${result.score}${result.benchmark.unit?.symbol ? ` ${result.benchmark.unit.symbol}` : ""}, comparison size ${result.comparison_size}.`,
          ),
        ...assessment.trade_offs.map((tradeOff) => `Trade-off: ${tradeOff}`),
      ].join("\n"),
    }));

    return [moduleChunk, ...deviceChunks];
  }

  private toCitation(chunk: RagChunk): AiCitation {
    return {
      entity_type: chunk.entityType,
      entity_id: chunk.entityId,
      title: chunk.title,
      slug: chunk.slug,
      excerpt: trimText(chunk.chunkText, 420),
      score: chunk.score,
    };
  }

  private async generateExplanation(
    question: string,
    chunks: RagChunk[],
    citations: AiCitation[],
  ) {
    const providerResult = await this.aiProvider
      .generateAnswer({
        question: [
          "Giải thích kết quả đánh giá hiệu quả triển khai mô-đun bằng tiếng Việt.",
          `Nhu cầu người dùng: ${question}`,
          "Thứ hạng và điểm đã được engine benchmark cố định; không thay đổi thứ tự.",
          "Chỉ dùng benchmark trong context, nêu điều kiện thử nghiệm và trade-off, gắn citation [n] cho từng nhận định chính.",
          "Không gọi điểm tương đối là hiệu suất điện năng nếu context không có phép đo công suất hoặc năng lượng.",
        ].join("\n"),
        chunks,
        citations,
      })
      .catch((error) => {
        this.logger.warn(
          `Hardware effectiveness explanation skipped: ${String(error)}`,
        );
        return null;
      });

    if (
      !providerResult ||
      !this.hasValidCitations(providerResult.answer, citations.length)
    ) {
      return null;
    }

    return providerResult;
  }

  private hasValidCitations(answer: string, citationCount: number) {
    const matches = Array.from(answer.matchAll(/\[(\d+)\]/g));
    return (
      matches.length > 0 &&
      matches.every((match) => {
        const citation = Number(match[1]);
        return citation >= 1 && citation <= citationCount;
      })
    );
  }

  private composeFallbackSummary(
    hardwareModule: HardwareModuleDetail,
    status: EvidenceStatus,
    rankedAssessments: ReturnType<HardwareResearchService["buildAssessments"]>,
    linkedDeviceCount: number,
    benchmarkedDeviceCount: number,
    comparableMetricCount: number,
  ) {
    if (status === "insufficient_data") {
      return `Chưa thể kết luận thiết bị nào sử dụng ${hardwareModule.name} hiệu quả hơn. SpecHub đang có ${linkedDeviceCount} phiên bản liên kết nhưng chưa có benchmark thiết bị phù hợp để đo kết quả đầu ra [1].`;
    }
    if (status === "partial") {
      return `SpecHub có benchmark liên quan cho ${benchmarkedDeviceCount}/${linkedDeviceCount} phiên bản dùng ${hardwareModule.name}, nhưng chưa có ít nhất hai thiết bị cùng benchmark và điều kiện thử nghiệm. Vì vậy hệ thống không tạo thứ hạng hiệu quả [1].`;
    }

    const first = rankedAssessments[0];
    if (!first) {
      return `Chưa thể tạo kết luận hiệu quả cho ${hardwareModule.name} [1].`;
    }
    const second = rankedAssessments[1];
    if (status === "modeled") {
      return `Các thiết bị dùng ${hardwareModule.name} hiện mới có dữ liệu cấu hình liên kết. SpecHub chưa xếp hạng hiệu năng cho đến khi có ít nhất hai kết quả cùng benchmark và cùng phiên bản [1].`;
    }

    const firstResult = first.benchmark_results.find(
      (result) => result.comparable,
    );
    const lines = firstResult
      ? [
          `${first.device.name} · ${first.device.variant_name} đạt ${firstResult.score}${firstResult.benchmark.unit?.symbol ? ` ${firstResult.benchmark.unit.symbol}` : " điểm"} ở ${firstResult.benchmark.name}${firstResult.benchmark.version ? ` ${firstResult.benchmark.version}` : ""}${firstResult.benchmark.subscore_name ? ` · ${firstResult.benchmark.subscore_name}` : ""} [2].`,
        ]
      : [
          `${first.device.name} · ${first.device.variant_name} có ${comparableMetricCount} hạng mục benchmark có thể đối chiếu [2].`,
        ];
    if (second) {
      const secondResult = second.benchmark_results.find(
        (result) =>
          result.comparable &&
          firstResult &&
          result.benchmark.slug === firstResult.benchmark.slug &&
          result.benchmark.version === firstResult.benchmark.version &&
          result.benchmark.subscore_name ===
            firstResult.benchmark.subscore_name,
      );
      if (secondResult) {
        lines.push(
          `${second.device.name} · ${second.device.variant_name} đạt ${secondResult.score}${secondResult.benchmark.unit?.symbol ? ` ${secondResult.benchmark.unit.symbol}` : " điểm"} trong cùng phép đo [3].`,
        );
      }
    }
    return lines.join("\n\n");
  }

  private missingData(
    linkedDeviceCount: number,
    benchmarkedDeviceCount: number,
    comparableMetricCount: number,
    records: PreparedBenchmark[],
  ) {
    const missing: string[] = [];
    if (benchmarkedDeviceCount < linkedDeviceCount) {
      missing.push(
        `device_benchmark_coverage (${benchmarkedDeviceCount}/${linkedDeviceCount} variants)`,
      );
    }
    if (!comparableMetricCount) {
      missing.push("comparable_benchmark_conditions");
    }
    if (records.some((record) => !this.hasRecordedConditions(record.record))) {
      missing.push("documented_test_conditions");
    }
    if (!this.hasEnergyEvidence(records)) {
      missing.push("power_or_energy_measurements");
    }
    return missing;
  }

  private hasEnergyEvidence(records: PreparedBenchmark[]) {
    const energyTerms = new Set([
      "power",
      "energy",
      "watt",
      "watts",
      "joule",
      "joules",
      "wh",
    ]);
    return records.some((record) => {
      const tokens = tokenize(
        [
          record.record.benchmark.name,
          record.record.benchmark.benchmark_type,
          record.record.benchmark.unit?.name,
          record.record.benchmark.unit?.symbol,
        ]
          .filter(Boolean)
          .join(" "),
      );
      return tokens.some((token) => energyTerms.has(token));
    });
  }

  private roundScore(value: number) {
    return Math.round(value * 10) / 10;
  }
}
