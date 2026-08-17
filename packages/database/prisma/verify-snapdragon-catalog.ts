import { PrismaClient } from "../generated/client";
import { SNAPDRAGON_SOURCE_RECORDS } from "./snapdragon-source-catalog";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const family = await prisma.technology_families.findUniqueOrThrow({
    where: { slug: "qualcomm-snapdragon" },
  });
  const chipsets = await prisma.chipsets.findMany({
    where: { technology_family_id: family.id, deleted_at: null },
    include: {
      _count: {
        select: {
          chipset_cpu_links: true,
          chipset_gpu_links: true,
          chipset_npu_links: true,
          chipset_modem_links: true,
        },
      },
      chipset_cpu_links: {
        include: { cpu: { include: { cpu_clusters: true } } },
      },
      chipset_gpu_links: { include: { gpu: true } },
    },
  });
  const sourceCodes = new Set(
    SNAPDRAGON_SOURCE_RECORDS.map((record) => record.modelCode),
  );
  const catalogCodes = new Set(
    chipsets.map((chipset) => chipset.model_code).filter(Boolean),
  );
  const missingCodes = [...sourceCodes].filter(
    (code) => !catalogCodes.has(code),
  );
  const unexpectedCodes = [...catalogCodes].filter(
    (code) => !sourceCodes.has(code!),
  );
  const missingCpu = chipsets.filter(
    (chipset) => chipset._count.chipset_cpu_links === 0,
  );
  const missingGpu = chipsets.filter(
    (chipset) => chipset._count.chipset_gpu_links === 0,
  );
  const cpus = [
    ...new Map(
      chipsets.flatMap((chipset) =>
        chipset.chipset_cpu_links.map((link) => [link.cpu.id, link.cpu]),
      ),
    ).values(),
  ];
  const gpus = [
    ...new Map(
      chipsets.flatMap((chipset) =>
        chipset.chipset_gpu_links.map((link) => [link.gpu.id, link.gpu]),
      ),
    ).values(),
  ];
  const gen3 = chipsets.find((chipset) => chipset.model_code === "SM8650-AB");
  const gen3Cpu = gen3?.chipset_cpu_links[0]?.cpu;
  const gen3Gpu = gen3?.chipset_gpu_links[0]?.gpu;

  assert(
    missingCodes.length === 0,
    `Missing Snapdragon model codes: ${missingCodes.join(", ")}`,
  );
  assert(
    missingCpu.length === 0,
    `Chipsets missing CPU links: ${missingCpu.map((chipset) => chipset.name).join(", ")}`,
  );
  assert(
    missingGpu.length === 0,
    `Chipsets missing GPU links: ${missingGpu.map((chipset) => chipset.name).join(", ")}`,
  );
  assert(
    cpus.some((cpu) => cpu.cpu_clusters.length > 0),
    "No Snapdragon CPU clusters were seeded.",
  );
  assert(
    gpus.some((gpu) => gpu.gpu_generation && gpu.clock_mhz),
    "No Snapdragon GPU generation and clock details were seeded.",
  );
  assert(
    gen3Cpu?.isa_name === "ARMv9.2-A" &&
      gen3Cpu.l2_cache === "1 MB" &&
      gen3Cpu.l3_cache === "12 MB" &&
      gen3Cpu.cpu_clusters.length === 4,
    "Snapdragon 8 Gen 3 CPU detail enrichment is incomplete.",
  );
  assert(
    gen3Gpu?.shader_units === 1536 &&
      gen3Gpu.compute_units === 6 &&
      gen3Gpu.vulkan_version === "1.3" &&
      gen3Gpu.opencl_version === "2.0" &&
      gen3Gpu.directx_feature_level === "12.1",
    "Snapdragon 8 Gen 3 GPU detail enrichment is incomplete.",
  );

  console.log(
    JSON.stringify(
      {
        sourceRecords: SNAPDRAGON_SOURCE_RECORDS.length,
        catalogChipsets: chipsets.length,
        cpuLinked: chipsets.filter(
          (chipset) => chipset._count.chipset_cpu_links > 0,
        ).length,
        gpuLinked: chipsets.filter(
          (chipset) => chipset._count.chipset_gpu_links > 0,
        ).length,
        npuLinked: chipsets.filter(
          (chipset) => chipset._count.chipset_npu_links > 0,
        ).length,
        modemLinked: chipsets.filter(
          (chipset) => chipset._count.chipset_modem_links > 0,
        ).length,
        cpuModules: cpus.length,
        cpuWithClusters: cpus.filter((cpu) => cpu.cpu_clusters.length > 0)
          .length,
        cpuWithCoreType: cpus.filter((cpu) => cpu.core_type).length,
        cpuWithCacheDetail: cpus.filter(
          (cpu) =>
            cpu.l1_instruction_cache ||
            cpu.l1_data_cache ||
            cpu.l2_cache ||
            cpu.l3_cache,
        ).length,
        gpuModules: gpus.length,
        gpuWithGeneration: gpus.filter((gpu) => gpu.gpu_generation).length,
        gpuWithClock: gpus.filter((gpu) => gpu.clock_mhz).length,
        gpuWithFp32: gpus.filter((gpu) => gpu.fp32_gflops).length,
        unexpectedCodes,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
