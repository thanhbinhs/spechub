import { PrismaClient } from "../generated/client";
import {
  COMPLETE_IPHONE_MODEL_COUNT,
  COMPLETE_IPHONE_MODEL_SLUGS,
} from "./iphone-catalog";

const prisma = new PrismaClient();

type MissingModule = {
  model: string;
  variant: string;
  missing: string[];
};

async function main() {
  const models = await prisma.device_models.findMany({
    where: {
      slug: { in: COMPLETE_IPHONE_MODEL_SLUGS },
      deleted_at: null,
    },
    select: {
      name: true,
      slug: true,
      cover_image_url: true,
      device_variants: {
        where: { deleted_at: null },
        select: {
          id: true,
          variant_name: true,
          variant_chipsets: { select: { id: true } },
          variant_cpus: { select: { id: true } },
          variant_gpus: { select: { id: true } },
          variant_npus: { select: { id: true } },
          variant_modems: { select: { id: true } },
          variant_displays: { select: { id: true } },
          variant_batteries: { select: { id: true } },
          variant_camera_modules: { select: { id: true } },
          variant_memory_configs: { select: { id: true } },
          variant_storage_configs: { select: { id: true } },
          variant_operating_systems: { select: { id: true } },
          variant_module_scores: { select: { id: true } },
          device_variant_benchmarks: {
            select: {
              subscore_name: true,
              benchmark: { select: { benchmark_type: true } },
            },
          },
          variant_scorecards: {
            orderBy: { calculated_at: "desc" },
            take: 1,
            select: {
              coverage_percent: true,
              overall_score: true,
              module_scores: {
                select: {
                  module_key: true,
                  coverage_percent: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const missingModelSlugs = COMPLETE_IPHONE_MODEL_SLUGS.filter(
    (slug) => !models.some((model) => model.slug === slug),
  );
  const missingModules: MissingModule[] = [];
  let variantCount = 0;
  let scorecardCount = 0;
  let scorecardModuleCount = 0;

  for (const model of models) {
    if (!model.cover_image_url) {
      missingModules.push({
        model: model.name,
        variant: "model",
        missing: ["cover_image_url"],
      });
    }
    if (!model.device_variants.length) {
      missingModules.push({
        model: model.name,
        variant: "model",
        missing: ["device_variant"],
      });
    }

    for (const variant of model.device_variants) {
      variantCount += 1;
      const missing: string[] = [];
      const requireLink = (name: string, links: unknown[]) => {
        if (!links.length) missing.push(name);
      };
      requireLink("chipset", variant.variant_chipsets);
      requireLink("cpu", variant.variant_cpus);
      requireLink("gpu", variant.variant_gpus);
      requireLink("npu", variant.variant_npus);
      requireLink("modem", variant.variant_modems);
      requireLink("display", variant.variant_displays);
      requireLink("battery", variant.variant_batteries);
      requireLink("camera", variant.variant_camera_modules);
      requireLink("memory", variant.variant_memory_configs);
      requireLink("storage", variant.variant_storage_configs);
      requireLink("operating-system", variant.variant_operating_systems);
      requireLink("module-score", variant.variant_module_scores);

      const subscoreNames = new Set(
        variant.device_variant_benchmarks.map(
          (benchmark) => benchmark.subscore_name,
        ),
      );
      const benchmarkTypes = new Set(
        variant.device_variant_benchmarks.map(
          (benchmark) => benchmark.benchmark.benchmark_type,
        ),
      );
      if (!subscoreNames.has("single_core"))
        missing.push("cpu-single-benchmark");
      if (!subscoreNames.has("multi_core")) missing.push("cpu-multi-benchmark");
      if (!benchmarkTypes.has("gpu")) missing.push("gpu-benchmark");
      if (!benchmarkTypes.has("battery")) missing.push("battery-benchmark");

      const scorecard = variant.variant_scorecards[0];
      if (!scorecard) {
        missing.push("scorecard");
      } else {
        scorecardCount += 1;
        scorecardModuleCount += scorecard.module_scores.length;
        if (Number(scorecard.coverage_percent) !== 100) {
          missing.push("scorecard-coverage");
        }
        if (scorecard.module_scores.length !== 8) {
          missing.push("scorecard-module-count");
        }
        if (
          scorecard.module_scores.some(
            (module) => Number(module.coverage_percent) !== 100,
          )
        ) {
          missing.push("scorecard-module-coverage");
        }
      }

      if (missing.length) {
        missingModules.push({
          model: model.name,
          variant: variant.variant_name,
          missing,
        });
      }
    }
  }

  if (
    models.length !== COMPLETE_IPHONE_MODEL_COUNT ||
    missingModelSlugs.length ||
    missingModules.length
  ) {
    throw new Error(
      JSON.stringify(
        {
          expectedModelCount: COMPLETE_IPHONE_MODEL_COUNT,
          actualModelCount: models.length,
          missingModelSlugs,
          missingModules,
        },
        null,
        2,
      ),
    );
  }

  const overallScores = models.flatMap((model) =>
    model.device_variants.map((variant) =>
      Number(variant.variant_scorecards[0]!.overall_score),
    ),
  );
  console.log(
    `✓ ${models.length} model, ${variantCount} biến thể iPhone, ` +
      `${scorecardCount} scorecard và ${scorecardModuleCount} nhóm điểm đều đầy đủ.`,
  );
  console.log(
    `✓ Độ phủ score: 100%; dải điểm tổng: ` +
      `${Math.min(...overallScores).toFixed(1)}–${Math.max(...overallScores).toFixed(1)}/100.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    (globalThis as any).process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
