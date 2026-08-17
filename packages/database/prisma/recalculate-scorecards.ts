import { PrismaClient } from "../generated/client";
import { seedVariantScorecards } from "./scoring/seed-scorecards";

const prisma = new PrismaClient();

async function main() {
  const result = await seedVariantScorecards(prisma);
  const incompleteScorecards = await prisma.variant_scorecards.count({
    where: { coverage_percent: { lt: 100 } },
  });
  const incompleteModules = await prisma.variant_scorecard_modules.count({
    where: { coverage_percent: { lt: 100 } },
  });

  if (incompleteScorecards || incompleteModules) {
    throw new Error(
      `Còn ${incompleteScorecards} scorecard và ${incompleteModules} nhóm điểm chưa đạt độ phủ 100%.`,
    );
  }

  console.log(
    `✓ Đã tính lại ${result.scorecardCount} scorecard và ${result.moduleScoreCount} nhóm điểm; tất cả đạt độ phủ 100%.`,
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
