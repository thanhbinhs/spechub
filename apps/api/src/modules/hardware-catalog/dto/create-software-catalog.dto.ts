import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateOperatingSystemReferenceDto {
  @ApiProperty({ example: "Android" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "android" })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  @MaxLength(140)
  slug!: string;

  @ApiProperty({ example: "android" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  os_family!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  vendor_org_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateOperatingSystemVersionDto {
  @ApiPropertyOptional({
    description: "Existing operating system UUID.",
  })
  @IsOptional()
  @IsUUID("4")
  operating_system_id?: string;

  @ApiPropertyOptional({ type: CreateOperatingSystemReferenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOperatingSystemReferenceDto)
  operating_system?: CreateOperatingSystemReferenceDto;

  @ApiProperty({ example: "16" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  version_name!: string;

  @ApiPropertyOptional({ example: "Baklava" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codename?: string;

  @ApiPropertyOptional({ example: "2025-06-10" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  release_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_of_support_date?: Date;

  @ApiPropertyOptional({ example: 36 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  api_level?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  kernel_version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOsUiLayerReferenceDto {
  @ApiProperty({ example: "One UI" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "one-ui" })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must be kebab-case",
  })
  @MaxLength(140)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  vendor_org_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  base_os_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateOsUiLayerVersionDto {
  @ApiPropertyOptional({ description: "Existing UI layer UUID." })
  @IsOptional()
  @IsUUID("4")
  ui_layer_id?: string;

  @ApiPropertyOptional({ type: CreateOsUiLayerReferenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOsUiLayerReferenceDto)
  ui_layer?: CreateOsUiLayerReferenceDto;

  @ApiProperty({ example: "8.0" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  version_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  base_os_version_id?: string;

  @ApiPropertyOptional({ example: "2025-10-01" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  release_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
