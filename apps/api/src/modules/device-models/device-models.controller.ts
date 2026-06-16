import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { DeviceModelResponseDto } from './dto/device-model-response.dto'
import { QueryDeviceModelsDto } from './dto/query-device-models.dto'
import { DeviceModelsService } from './device-models.service'

@Public()
@ApiTags('device-models')
@Controller('device-models')
export class DeviceModelsController {
  constructor(private readonly deviceModelsService: DeviceModelsService) {}

  @Get()
  @ApiOperation({ summary: 'List device models' })
  @ApiResponse({ status: 200, type: DeviceModelResponseDto, isArray: true })
  findMany(@Query() query: QueryDeviceModelsDto) {
    return this.deviceModelsService.findMany(query)
  }

  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get device model by UUID' })
  @ApiResponse({ status: 200, type: DeviceModelResponseDto })
  @ApiResponse({ status: 404, description: 'Device model not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceModelsService.findById(id)
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get device model by slug' })
  @ApiResponse({ status: 200, type: DeviceModelResponseDto })
  @ApiResponse({ status: 404, description: 'Device model not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.deviceModelsService.findBySlug(slug)
  }
}
