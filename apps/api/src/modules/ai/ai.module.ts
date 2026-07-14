import { Module } from "@nestjs/common";
import { HardwareCatalogModule } from "../hardware-catalog/hardware-catalog.module";
import { AiController } from "./ai.controller";
import { AiProviderService } from "./ai-provider.service";
import { AiService } from "./ai.service";
import { HardwareResearchService } from "./hardware-research.service";

@Module({
  imports: [HardwareCatalogModule],
  controllers: [AiController],
  providers: [AiProviderService, AiService, HardwareResearchService],
  exports: [AiService],
})
export class AiModule {}
