import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

/**
 * IdParamDto - Validate :id trong URL params
 *
 * Usage:
 *   @Get(':id')
 *   findById(@Param() params: IdParamDto) {
 *     return this.service.findById(params.id)
 *   }
 */
export class IdParamDto {
  @ApiProperty({
    description: 'UUID của resource',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  id!: string
}

/**
 * SlugParamDto - Validate :slug trong URL params
 */
export class SlugParamDto {
  @ApiProperty({
    description: 'Slug của resource',
    example: 'iphone-16-pro',
  })
  slug!: string
}