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
import { CreateProductFamilyDto } from './dto/create-product-family.dto'
import { ProductFamilyResponseDto } from './dto/product-family-response.dto'
import { QueryProductFamiliesDto } from './dto/query-product-families.dto'
import { UpdateProductFamilyDto } from './dto/update-product-family.dto'
import { ProductFamiliesService } from './product-families.service'

@ApiTags('product-families')
@Controller('product-families')
export class ProductFamiliesController {
  constructor(private readonly productFamiliesService: ProductFamiliesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List product families' })
  @ApiResponse({ status: 200, type: ProductFamilyResponseDto, isArray: true })
  findMany(@Query() query: QueryProductFamiliesDto) {
    return this.productFamiliesService.findMany(query)
  }

  @Public()
  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get product family by UUID' })
  @ApiResponse({ status: 200, type: ProductFamilyResponseDto })
  @ApiResponse({ status: 404, description: 'Product family not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productFamiliesService.findById(id)
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product family by slug' })
  @ApiResponse({ status: 200, type: ProductFamilyResponseDto })
  @ApiResponse({ status: 404, description: 'Product family not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productFamiliesService.findBySlug(slug)
  }

  @Post()
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Create product family' })
  create(@Body() dto: CreateProductFamilyDto) {
    return this.productFamiliesService.create(dto)
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Update product family' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductFamilyDto,
  ) {
    return this.productFamiliesService.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Soft-delete product family' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productFamiliesService.remove(id)
  }
}
