import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class AskAiDto {
  @ApiProperty({ example: "Compare iPhone 16 Pro battery and chipset." })
  @IsString()
  @MinLength(2)
  @MaxLength(1_000)
  question!: string;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  top_k?: number = 5;
}
