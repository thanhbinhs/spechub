import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDate, IsIn, IsOptional, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
] as const;

export const BILLING_CYCLES = ["monthly", "yearly", "manual"] as const;

export class AssignSubscriptionDto {
  @ApiProperty()
  @IsUUID("4")
  plan_id!: string;

  @ApiPropertyOptional({ enum: SUBSCRIPTION_STATUSES, default: "active" })
  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES)
  status?: string;

  @ApiProperty({ enum: BILLING_CYCLES, example: "monthly" })
  @IsIn(BILLING_CYCLES)
  billing_cycle!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  current_period_end?: Date;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  cancel_at_period_end?: boolean;
}
