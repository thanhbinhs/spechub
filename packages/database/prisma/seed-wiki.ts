import { PrismaClient } from "../generated/client";
import { seedWikiContent } from "./seed-wiki-content";

const prisma = new PrismaClient();
const process = (globalThis as any).process;

seedWikiContent(prisma)
  .then((count) => {
    console.log(`✅ Đã cập nhật ${count} bài Wiki tiếng Việt.`);
  })
  .catch((error) => {
    console.error("❌ Không thể cập nhật nội dung Wiki:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
