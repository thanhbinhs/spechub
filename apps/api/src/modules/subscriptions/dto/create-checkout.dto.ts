import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString } from "class-validator";
import { BILLING_CYCLES } from "./assign-subscription.dto";

export class CreateCheckoutDto {
  @ApiProperty({ example: "pro" })
  @IsString()
  plan_code!: string;

  @ApiProperty({ enum: BILLING_CYCLES, example: "monthly" })
  @IsIn(BILLING_CYCLES)
  billing_cycle!: string;
}
