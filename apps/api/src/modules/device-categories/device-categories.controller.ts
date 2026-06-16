import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { DeviceCategoryResponseDto } from './dto/device-category-response.dto'
import { QueryDeviceCategoriesDto } from './dto/query-device-categories.dto'
import { DeviceCategoriesService } from './device-categories.service'

@Public()
@ApiTags('device-categories')
@Controller('device-categories')
export class DeviceCategoriesController {
  constructor(private readonly deviceCategoriesService: DeviceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List device categories' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto, isArray: true })
  findMany(@Query() query: QueryDeviceCategoriesDto) {
    return this.deviceCategoriesService.findMany(query)
  }

  @Get('tree')
  @ApiOperation({ summary: 'List active device categories as a tree' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto, isArray: true })
  findTree() {
    return this.deviceCategoriesService.findTree()
  }

  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get device category by UUID' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Device category not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceCategoriesService.findById(id)
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get device category by slug' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Device category not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.deviceCategoriesService.findBySlug(slug)
  }
}
