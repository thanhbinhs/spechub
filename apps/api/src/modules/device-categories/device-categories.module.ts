import { Module } from '@nestjs/common'
import { DeviceCategoriesController } from './device-categories.controller'
import { DeviceCategoriesService } from './device-categories.service'

@Module({
  controllers: [DeviceCategoriesController],
  providers: [DeviceCategoriesService],
  exports: [DeviceCategoriesService],
})
export class DeviceCategoriesModule {}
