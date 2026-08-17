import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
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
  @MinLength(10)
  @MaxLength(300)
  title!: string;

  @ApiProperty({ example: "apple-iphone-16-pro" })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must contain lowercase letters, numbers and hyphens only",
  })
  @MaxLength(320)
  slug!: string;

  @ApiPropertyOptional({
    enum: ["guide", "introduction", "review", "comparison", "tutorial"],
    default: "guide",
  })
  @IsOptional()
  @IsIn(["guide", "introduction", "review", "comparison", "tutorial"])
  article_type?: string;

  @ApiPropertyOptional({ type: [String], example: ["smartphone", "camera"] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description:
      "HTTP(S) URL or site-relative path for the article cover image",
    example: "https://images.example.com/iphone-camera-comparison.webp",
    maxLength: 2048,
    nullable: true,
  })
  @IsOptional()
  @Matches(/^(?:https?:\/\/[^\s]+|\/(?!\/)[^\s]+)$/i, {
    message:
      "cover_image_url must be an HTTP(S) URL or a site-relative image path",
  })
  @MaxLength(2048)
  cover_image_url?: string | null;

  @ApiPropertyOptional({
    description: "Accessible alternative text for the cover image",
    example: "Camera modules of two flagship phones placed side by side",
    maxLength: 300,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  cover_image_alt?: string | null;

  @ApiPropertyOptional({
    description: "Caption displayed with the cover image",
    example: "The camera layouts differ in sensor size and zoom range.",
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  cover_image_caption?: string | null;

  @ApiPropertyOptional({
    description: "Image creator, publisher, or licensing credit",
    example: "Photo: SpecHub",
    maxLength: 200,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  cover_image_credit?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({
    description: "Markdown only; HTML is rendered by the client",
  })
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
