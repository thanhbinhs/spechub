import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type DashboardTab =
  | "device-management"
  | "users"
  | "hardware"
  | "affiliates"
  | "subscriptions";

type DashboardTone = "danger" | "warning" | "info" | "success";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(includeUserMetrics: boolean) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    const activityStart = this.monthStart(now, -5);

    const [
      models,
      variants,
      scorecards,
      scorecardModules,
      wikiArticles,
      users,
      partners,
      activeSubscriptions,
      searchesThirtyDays,
      affiliateClicksThirtyDays,
      benchmarkResults,
      embeddingRows,
      hardwareCounts,
    ] = await Promise.all([
      this.prisma.device_models.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          name: true,
          created_at: true,
          product_family: {
            select: {
              device_category: {
                select: { name: true, slug: true },
              },
            },
          },
        },
      }),
      this.prisma.device_variants.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          variant_name: true,
          created_at: true,
          device_model: {
            select: { name: true },
          },
        },
      }),
      this.prisma.variant_scorecards.findMany({
        select: {
          id: true,
          device_variant_id: true,
          category_slug: true,
          overall_score: true,
          coverage_percent: true,
          calculated_at: true,
          device_variant: {
            select: {
              variant_name: true,
              device_model: { select: { name: true } },
            },
          },
        },
        orderBy: [{ calculated_at: "desc" }],
      }),
      this.prisma.variant_scorecard_modules.findMany({
        select: {
          scorecard_id: true,
          module_key: true,
          module_name: true,
          score: true,
          coverage_percent: true,
        },
      }),
      this.prisma.wiki_articles.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          title: true,
          status: true,
          view_count: true,
          created_at: true,
          updated_at: true,
          published_at: true,
        },
      }),
      includeUserMetrics
        ? this.prisma.users.findMany({
            where: { deleted_at: null },
            select: {
              id: true,
              role: true,
              is_active: true,
              created_at: true,
              last_login_at: true,
            },
          })
        : Promise.resolve([]),
      this.prisma.affiliate_partners.findMany({
        select: { id: true, is_active: true },
      }),
      this.prisma.subscriptions.count({
        where: { status: { in: ["active", "trialing"] } },
      }),
      this.prisma.search_logs.count({
        where: { created_at: { gte: thirtyDaysAgo } },
      }),
      this.prisma.affiliate_clicks.count({
        where: { clicked_at: { gte: thirtyDaysAgo } },
      }),
      this.prisma.device_variant_benchmarks.count(),
      this.prisma.embeddings.findMany({
        select: { entity_type: true, entity_id: true },
      }),
      this.getHardwareCounts(),
    ]);

    const latestScorecards = Array.from(
      scorecards
        .reduce((items, scorecard) => {
          if (!items.has(scorecard.device_variant_id)) {
            items.set(scorecard.device_variant_id, scorecard);
          }
          return items;
        }, new Map<string, (typeof scorecards)[number]>())
        .values(),
    );
    const latestScorecardIds = new Set(
      latestScorecards.map((scorecard) => scorecard.id),
    );
    const currentModules = scorecardModules.filter((module) =>
      latestScorecardIds.has(module.scorecard_id),
    );
    const scoredVariantIds = new Set(
      latestScorecards.map((scorecard) => scorecard.device_variant_id),
    );
    const fullyScored = latestScorecards.filter(
      (scorecard) => Number(scorecard.coverage_percent) >= 99.95,
    ).length;
    const partialScored = latestScorecards.length - fullyScored;
    const missingScorecards = variants.length - scoredVariantIds.size;
    const averageCoverage = this.average(
      latestScorecards.map((scorecard) => Number(scorecard.coverage_percent)),
    );
    const averageScore = this.average(
      latestScorecards.map((scorecard) => Number(scorecard.overall_score)),
    );
    const benchmarkCoverage =
      variants.length > 0
        ? this.round((fullyScored / variants.length) * 100)
        : 0;

    const categoryMap = new Map<
      string,
      { slug: string; label: string; count: number }
    >();
    for (const model of models) {
      const category = model.product_family.device_category;
      const current = categoryMap.get(category.slug);
      if (current) {
        current.count += 1;
      } else {
        categoryMap.set(category.slug, {
          slug: category.slug,
          label: category.name,
          count: 1,
        });
      }
    }
    const catalogByCategory = Array.from(categoryMap.values())
      .sort((left, right) => right.count - left.count)
      .map((item) => ({
        ...item,
        percent:
          models.length > 0
            ? this.round((item.count / models.length) * 100)
            : 0,
      }));

    const contentStatuses = [
      ["published", "Đã xuất bản"],
      ["draft", "Bản nháp"],
      ["archived", "Đã lưu trữ"],
    ].map(([status, label]) => ({
      status,
      label,
      count: wikiArticles.filter((article) => article.status === status).length,
    }));

    const modulesByKey = new Map<
      string,
      {
        key: string;
        label: string;
        coverages: number[];
        scores: number[];
      }
    >();
    for (const module of currentModules) {
      const current = modulesByKey.get(module.module_key) ?? {
        key: module.module_key,
        label: module.module_name,
        coverages: [],
        scores: [],
      };
      current.coverages.push(Number(module.coverage_percent));
      current.scores.push(Number(module.score));
      modulesByKey.set(module.module_key, current);
    }
    const moduleCoverage = Array.from(modulesByKey.values())
      .map((module) => ({
        key: module.key,
        label: module.label,
        coverage: this.average(module.coverages),
        average_score: this.average(module.scores),
        device_count: module.coverages.length,
      }))
      .sort((left, right) => right.coverage - left.coverage);

    const monthlyActivity = this.buildMonthSeries(now, 6).map((month) => ({
      month,
      device_models: models.filter(
        (model) =>
          model.created_at >= activityStart &&
          this.monthKey(model.created_at) === month,
      ).length,
      wiki_articles: wikiArticles.filter((article) => {
        const occurredAt = article.published_at ?? article.created_at;
        return (
          occurredAt >= activityStart && this.monthKey(occurredAt) === month
        );
      }).length,
      users: users.filter(
        (user) =>
          user.created_at >= activityStart &&
          this.monthKey(user.created_at) === month,
      ).length,
    }));

    const publishedWiki = wikiArticles.filter(
      (article) => article.status === "published",
    ).length;
    const activeUsers = includeUserMetrics
      ? users.filter((user) => user.is_active).length
      : null;

    const attentionItems = this.buildAttentionItems({
      missingScorecards,
      partialScorecards: partialScored,
    });

    const recentActivity = [
      ...models.map((model) => ({
        id: `model-${model.id}`,
        type: "device" as const,
        label: `Đã thêm ${model.name}`,
        detail: model.product_family.device_category.name,
        occurred_at: model.created_at.toISOString(),
        tab: "device-management" as DashboardTab,
      })),
      ...wikiArticles.map((article) => ({
        id: `wiki-${article.id}`,
        type: "wiki" as const,
        label: article.title,
        detail:
          article.status === "published"
            ? "Wiki đã xuất bản"
            : "Wiki đang biên tập",
        occurred_at: article.updated_at.toISOString(),
        tab: "device-management" as DashboardTab,
      })),
      ...latestScorecards.map((scorecard) => ({
        id: `scorecard-${scorecard.id}`,
        type: "score" as const,
        label: scorecard.device_variant.device_model.name,
        detail: `Đã tính điểm ${this.round(Number(scorecard.overall_score))}/100`,
        occurred_at: scorecard.calculated_at.toISOString(),
        tab: "device-management" as DashboardTab,
      })),
    ]
      .sort(
        (left, right) =>
          new Date(right.occurred_at).getTime() -
          new Date(left.occurred_at).getTime(),
      )
      .slice(0, 7);

    const indexedDeviceModels = new Set(
      embeddingRows
        .filter((row) => row.entity_type === "device_model")
        .map((row) => row.entity_id),
    ).size;
    const indexedKnowledgeRecords = new Set(
      embeddingRows
        .filter(
          (row) =>
            row.entity_type !== "device_model" &&
            row.entity_type !== "raw_page",
        )
        .map((row) => `${row.entity_type}:${row.entity_id}`),
    ).size;
    const wikiViews = wikiArticles.reduce(
      (total, article) => total + Number(article.view_count),
      0,
    );

    return {
      data: {
        generated_at: now.toISOString(),
        kpis: {
          device_models: models.length,
          device_variants: variants.length,
          benchmark_coverage_percent: benchmarkCoverage,
          published_wiki: publishedWiki,
          active_users: activeUsers,
        },
        score_health: {
          total_variants: variants.length,
          fully_scored: fullyScored,
          partial_scored: partialScored,
          missing_scorecards: Math.max(0, missingScorecards),
          average_coverage: averageCoverage,
          average_score: averageScore,
        },
        catalog_by_category: catalogByCategory,
        content_statuses: contentStatuses,
        module_coverage: moduleCoverage,
        monthly_activity: monthlyActivity,
        engagement: {
          searches_30d: searchesThirtyDays,
          affiliate_clicks_30d: affiliateClicksThirtyDays,
          wiki_views: wikiViews,
          active_subscriptions: activeSubscriptions,
        },
        inventory: {
          hardware_modules: hardwareCounts.total,
          hardware_by_kind: hardwareCounts.byKind,
          benchmark_results: benchmarkResults,
          active_partners: partners.filter((partner) => partner.is_active)
            .length,
          ai_chunks: embeddingRows.length,
          indexed_device_models: indexedDeviceModels,
          indexed_knowledge_records: indexedKnowledgeRecords,
        },
        attention_items: attentionItems,
        recent_activity: recentActivity,
      },
    };
  }

  private async getHardwareCounts() {
    const labels = [
      ["chipset", "Chipset", this.prisma.chipsets.count()],
      ["cpu", "CPU", this.prisma.cpus.count()],
      ["gpu", "GPU", this.prisma.gpus.count()],
      ["npu", "NPU", this.prisma.npus.count()],
      ["modem", "Modem", this.prisma.modems.count()],
      ["display", "Màn hình", this.prisma.display_units.count()],
      ["camera", "Máy ảnh", this.prisma.camera_modules.count()],
      ["battery", "Pin", this.prisma.battery_units.count()],
      ["memory", "Bộ nhớ", this.prisma.memory_standards.count()],
      ["storage", "Lưu trữ", this.prisma.storage_standards.count()],
    ] as const;
    const counts = await Promise.all(labels.map((item) => item[2]));
    const byKind = labels.map(([key, label], index) => ({
      key,
      label,
      count: counts[index],
    }));

    return {
      byKind,
      total: counts.reduce((total, count) => total + count, 0),
    };
  }

  private buildAttentionItems(input: {
    missingScorecards: number;
    partialScorecards: number;
  }) {
    const items: Array<{
      id: string;
      tone: DashboardTone;
      label: string;
      detail: string;
      count: number;
      tab: DashboardTab;
    }> = [];
    if (input.missingScorecards > 0) {
      items.push({
        id: "missing-scorecards",
        tone: "danger",
        label: "Phiên bản chưa có bảng điểm",
        detail: "Cần tính scorecard trước khi so sánh hoặc xếp hạng.",
        count: input.missingScorecards,
        tab: "device-management",
      });
    }
    if (input.partialScorecards > 0) {
      items.push({
        id: "partial-scorecards",
        tone: "warning",
        label: "Bảng điểm chưa đủ dữ liệu",
        detail: "Độ phủ dưới 100%, cần bổ sung chỉ số gốc.",
        count: input.partialScorecards,
        tab: "device-management",
      });
    }
    if (items.length === 0) {
      items.push({
        id: "all-clear",
        tone: "success",
        label: "Không có việc tồn đọng quan trọng",
        detail: "Dữ liệu điểm và danh mục đang ổn định.",
        count: 0,
        tab: "device-management",
      });
    }
    return items;
  }

  private buildMonthSeries(now: Date, count: number) {
    return Array.from({ length: count }, (_, index) =>
      this.monthKey(this.monthStart(now, index - count + 1)),
    );
  }

  private monthStart(date: Date, offset: number) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1),
    );
  }

  private monthKey(date: Date) {
    return date.toISOString().slice(0, 7);
  }

  private average(values: number[]) {
    if (values.length === 0) return 0;
    return this.round(
      values.reduce((total, value) => total + value, 0) / values.length,
    );
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }
}
