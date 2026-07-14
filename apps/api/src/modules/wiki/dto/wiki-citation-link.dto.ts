import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class WikiCitationLinkDto {
  @ApiProperty()
  @IsUUID("4")
  citation_id!: string;

  @ApiPropertyOptional({ description: "Optional Markdown anchor or section key" })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  anchor_key?: string;
}
