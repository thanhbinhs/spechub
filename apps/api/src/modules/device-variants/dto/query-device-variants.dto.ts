import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationQueryDto } from '../../../common/dto/pagination.dto'

export class QueryDeviceVariantsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'iphone-16-pro' })
  @IsOptional()
  @IsString()
  model_slug?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  device_model_id?: string

  @ApiPropertyOptional({ example: 'Natural Titanium' })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  default_only?: boolean
}
