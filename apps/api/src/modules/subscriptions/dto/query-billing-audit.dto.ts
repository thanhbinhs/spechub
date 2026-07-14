import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsUUID, Max, Min } from "class-validator";

export class QueryBillingAuditDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  user_id?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
