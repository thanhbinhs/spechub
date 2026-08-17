import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CatalogStudioController } from "./catalog-studio.controller";
import { CatalogEvidenceService } from "./catalog-evidence.service";
import { CatalogStudioService } from "./catalog-studio.service";
import { QuickCatalogIntakeService } from "./quick-catalog-intake.service";
import { StorageSigningService } from "./storage-signing.service";

@Module({
  imports: [PrismaModule],
  controllers: [CatalogStudioController],
  providers: [
    CatalogStudioService,
    CatalogEvidenceService,
    QuickCatalogIntakeService,
    StorageSigningService,
  ],
  exports: [CatalogStudioService],
})
export class CatalogStudioModule {}
