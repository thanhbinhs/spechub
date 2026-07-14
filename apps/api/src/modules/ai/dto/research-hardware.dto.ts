import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export const HARDWARE_RESEARCH_FOCI = [
  "balanced",
  "latest",
  "adoption",
  "evolution",
] as const;

export type HardwareResearchFocus = (typeof HARDWARE_RESEARCH_FOCI)[number];

export class ResearchHardwareDto {
  @ApiPropertyOptional({
    example: "Dòng nào phù hợp để nghiên cứu khả năng triển khai lâu dài?",
    minLength: 2,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  question?: string;

  @ApiPropertyOptional({
    enum: HARDWARE_RESEARCH_FOCI,
    default: "balanced",
    deprecated: true,
    description:
      "Legacy catalog-ranking option. Effectiveness evaluation always uses comparable device benchmarks.",
  })
  @IsOptional()
  @IsIn(HARDWARE_RESEARCH_FOCI)
  focus?: HardwareResearchFocus;
}
