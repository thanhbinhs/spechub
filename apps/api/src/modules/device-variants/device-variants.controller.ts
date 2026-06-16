import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { CompareDeviceVariantsDto } from './dto/compare-device-variants.dto'
import { DeviceVariantResponseDto } from './dto/device-variant-response.dto'
import { QueryDeviceVariantsDto } from './dto/query-device-variants.dto'
import { DeviceVariantsService } from './device-variants.service'

@Public()
@ApiTags('device-variants')
@Controller('device-variants')
export class DeviceVariantsController {
  constructor(private readonly deviceVariantsService: DeviceVariantsService) {}

  @Get()
  @ApiOperation({ summary: 'List device variants' })
  @ApiResponse({ status: 200, type: DeviceVariantResponseDto, isArray: true })
  findMany(@Query() query: QueryDeviceVariantsDto) {
    return this.deviceVariantsService.findMany(query)
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare 2 to 4 device variants' })
  @ApiResponse({ status: 200, type: DeviceVariantResponseDto, isArray: true })
  compare(@Query() query: CompareDeviceVariantsDto) {
    return this.deviceVariantsService.compare(query.ids)
  }

  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get device variant by UUID' })
  @ApiResponse({ status: 200, type: DeviceVariantResponseDto })
  @ApiResponse({ status: 404, description: 'Device variant not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceVariantsService.findById(id)
  }
}
