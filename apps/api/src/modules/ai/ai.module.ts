import { Module } from "@nestjs/common";
import { HardwareCatalogModule } from "../hardware-catalog/hardware-catalog.module";
import { AiController } from "./ai.controller";
import { AiKnowledgeService } from "./ai-knowledge.service";
import { AiProviderService } from "./ai-provider.service";
import { AiService } from "./ai.service";
import { DeviceRecommendationService } from "./device-recommendation.service";
import { HardwareResearchService } from "./hardware-research.service";

@Module({
  imports: [HardwareCatalogModule],
  controllers: [AiController],
  providers: [
    AiKnowledgeService,
    AiProviderService,
    AiService,
    DeviceRecommendationService,
    HardwareResearchService,
  ],
  exports: [AiService],
})
export class AiModule {}
