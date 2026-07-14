import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class TrackAffiliateClickDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID("4")
  session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referrer?: string;
}
