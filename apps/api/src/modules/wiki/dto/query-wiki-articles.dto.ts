import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";
import { WIKI_ARTICLE_STATUSES, type WikiArticleStatus } from "./wiki-article-status";

export class QueryWikiArticlesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: "vi" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language_code?: string;

  @ApiPropertyOptional({ example: "device_models" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entity_table?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entity_id?: string;

  @ApiPropertyOptional({ enum: WIKI_ARTICLE_STATUSES })
  @IsOptional()
  @IsIn(WIKI_ARTICLE_STATUSES)
  status?: WikiArticleStatus;

  @ApiPropertyOptional({ example: "iphone" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
