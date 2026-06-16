import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { ProductFamilyResponseDto } from './dto/product-family-response.dto'
import { QueryProductFamiliesDto } from './dto/query-product-families.dto'
import { ProductFamiliesService } from './product-families.service'

@Public()
@ApiTags('product-families')
@Controller('product-families')
export class ProductFamiliesController {
  constructor(private readonly productFamiliesService: ProductFamiliesService) {}

  @Get()
  @ApiOperation({ summary: 'List product families' })
  @ApiResponse({ status: 200, type: ProductFamilyResponseDto, isArray: true })
  findMany(@Query() query: QueryProductFamiliesDto) {
    return this.productFamiliesService.findMany(query)
  }

  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get product family by UUID' })
  @ApiResponse({ status: 200, type: ProductFamilyResponseDto })
  @ApiResponse({ status: 404, description: 'Product family not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productFamiliesService.findById(id)
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product family by slug' })
  @ApiResponse({ status: 200, type: ProductFamilyResponseDto })
  @ApiResponse({ status: 404, description: 'Product family not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productFamiliesService.findBySlug(slug)
  }
}
