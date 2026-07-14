import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { USER_ROLES } from '../../common/constants'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CreateDeviceCategoryDto } from './dto/create-device-category.dto'
import { DeviceCategoryResponseDto } from './dto/device-category-response.dto'
import { QueryDeviceCategoriesDto } from './dto/query-device-categories.dto'
import { UpdateDeviceCategoryDto } from './dto/update-device-category.dto'
import { DeviceCategoriesService } from './device-categories.service'

@ApiTags('device-categories')
@Controller('device-categories')
export class DeviceCategoriesController {
  constructor(private readonly deviceCategoriesService: DeviceCategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List device categories' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto, isArray: true })
  findMany(@Query() query: QueryDeviceCategoriesDto) {
    return this.deviceCategoriesService.findMany(query)
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'List active device categories as a tree' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto, isArray: true })
  findTree() {
    return this.deviceCategoriesService.findTree()
  }

  @Public()
  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get device category by UUID' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Device category not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceCategoriesService.findById(id)
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get device category by slug' })
  @ApiResponse({ status: 200, type: DeviceCategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Device category not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.deviceCategoriesService.findBySlug(slug)
  }

  @Post()
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Create device category' })
  create(@Body() dto: CreateDeviceCategoryDto) {
    return this.deviceCategoriesService.create(dto)
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Update device category' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeviceCategoryDto,
  ) {
    return this.deviceCategoriesService.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Soft-delete device category' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.deviceCategoriesService.remove(id)
  }
}
