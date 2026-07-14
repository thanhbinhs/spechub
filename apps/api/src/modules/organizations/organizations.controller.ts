import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { USER_ROLES } from '../../common/constants'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { QueryOrganizationsDto } from './dto/query-organization.dto'
import { OrganizationResponseDto } from './dto/organization-response.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'
import { OrganizationsService } from './organizations.service'

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto, isArray: true })
  findMany(@Query() query: QueryOrganizationsDto) {
    return this.organizationsService.findMany(query)
  }

  @Public()
  @Get(':id/by-id')
  @ApiOperation({ summary: 'Get organization by UUID' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findById(id)
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug)
  }

  @Post()
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Create organization' })
  @ApiResponse({ status: 201, type: OrganizationResponseDto })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto)
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: 'Soft-delete organization' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id)
  }
}
