import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export const B2B_ENTITY_TYPES = [
  "device_model",
  "device_variant",
] as const;

export type B2bEntityType = (typeof B2B_ENTITY_TYPES)[number];

export class QueryB2bCatalogChangesDto {
  @ApiPropertyOptional({
    description:
      "Opaque cursor returned by the preceding synchronization request. Omit it to start a full snapshot.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  cursor?: string;

  @ApiPropertyOptional({
    description: "Maximum change events to return in one page.",
    default: 100,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 100;
}

export class B2bCatalogRecordReferenceDto {
  @ApiProperty({ enum: B2B_ENTITY_TYPES })
  @IsIn(B2B_ENTITY_TYPES)
  entity_type!: B2bEntityType;

  @ApiProperty({ format: "uuid" })
  @IsUUID("4")
  id!: string;
}

export class ResolveB2bCatalogRecordsDto {
  @ApiProperty({
    type: B2bCatalogRecordReferenceDto,
    isArray: true,
    description:
      "Distinct catalog records to resolve. Deleted or unavailable records are returned in missing instead of failing the full batch.",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => B2bCatalogRecordReferenceDto)
  records!: B2bCatalogRecordReferenceDto[];
}
