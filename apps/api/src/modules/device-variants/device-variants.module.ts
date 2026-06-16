import { Module } from '@nestjs/common'
import { DeviceVariantsController } from './device-variants.controller'
import { DeviceVariantsService } from './device-variants.service'

@Module({
  controllers: [DeviceVariantsController],
  providers: [DeviceVariantsService],
  exports: [DeviceVariantsService],
})
export class DeviceVariantsModule {}
