import { Module } from "@nestjs/common";
import { ApiKeysModule } from "../api-keys/api-keys.module";
import { DeviceModelsModule } from "../device-models/device-models.module";
import { DeviceVariantsModule } from "../device-variants/device-variants.module";
import { B2bController } from "./b2b.controller";

@Module({
  imports: [ApiKeysModule, DeviceModelsModule, DeviceVariantsModule],
  controllers: [B2bController],
})
export class B2bModule {}
