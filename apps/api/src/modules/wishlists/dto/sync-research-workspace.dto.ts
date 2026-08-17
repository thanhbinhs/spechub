import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class ResearchWorkspaceSavedItemDto {
  @ApiProperty()
  @IsUUID("4")
  device_variant_id!: string;

  @ApiPropertyOptional({ maxLength: 2_000 })
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  notes?: string;
}

export class SyncResearchWorkspaceDto {
  @ApiProperty({ enum: ["merge", "replace"], default: "merge" })
  @IsIn(["merge", "replace"])
  mode!: "merge" | "replace";

  @ApiPropertyOptional({ type: [ResearchWorkspaceSavedItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ResearchWorkspaceSavedItemDto)
  saved_items?: ResearchWorkspaceSavedItemDto[] = [];

  @ApiPropertyOptional({ type: [String], maxItems: 2 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @IsUUID("4", { each: true })
  compare_variant_ids?: string[] = [];
}
