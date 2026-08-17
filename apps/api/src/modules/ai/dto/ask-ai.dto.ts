import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class AiConversationMessageDto {
  @ApiProperty({ enum: ["user", "assistant"] })
  @IsIn(["user", "assistant"])
  role!: "user" | "assistant";

  @ApiProperty({ example: "Còn thời lượng pin thì sao?" })
  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  content!: string;
}

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

  @ApiPropertyOptional({
    type: () => AiConversationMessageDto,
    isArray: true,
    maxItems: 16,
    description:
      "Recent client-side turns used to preserve the selected device/topic in contextual follow-up questions.",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(16)
  @ValidateNested({ each: true })
  @Type(() => AiConversationMessageDto)
  history?: AiConversationMessageDto[];
}
