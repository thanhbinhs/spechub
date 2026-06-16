import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { QueryOrganizationsDto } from './dto/query-organization.dto'
import { OrganizationResponseDto } from './dto/organization-response.dto'
import { OrganizationsService } from './organizations.service'

@Public()
@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto, isArray: true })
  findMany(@Query() query: QueryOrganizationsDto) {
    return this.organizationsService.findMany(query)
  }

  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get organization by UUID' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findById(id)
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug)
  }
}
