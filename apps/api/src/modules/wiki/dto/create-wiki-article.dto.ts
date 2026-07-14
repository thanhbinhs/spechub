import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import {
  WIKI_ARTICLE_STATUSES,
  type WikiArticleStatus,
} from "./wiki-article-status";
import { WikiCitationLinkDto } from "./wiki-citation-link.dto";

export class CreateWikiArticleDto {
  @ApiProperty({ example: "device_models" })
  @IsString()
  @MaxLength(80)
  entity_table!: string;

  @ApiProperty({ example: "a2b4e6a6-53a2-4b21-856b-a374c9271c19" })
  @IsString()
  @MaxLength(64)
  entity_id!: string;

  @ApiPropertyOptional({ example: "vi", default: "default language" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language_code?: string;

  @ApiProperty({ example: "Apple iPhone 16 Pro" })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ example: "apple-iphone-16-pro" })
  @IsString()
  @MaxLength(320)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: "Markdown only; HTML is rendered by the client" })
  @IsOptional()
  @IsString()
  body_markdown?: string;

  @ApiPropertyOptional({ enum: WIKI_ARTICLE_STATUSES, default: "draft" })
  @IsOptional()
  @IsIn(WIKI_ARTICLE_STATUSES)
  status?: WikiArticleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  change_summary?: string;

  @ApiPropertyOptional({ type: [WikiCitationLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WikiCitationLinkDto)
  citations?: WikiCitationLinkDto[];
}
