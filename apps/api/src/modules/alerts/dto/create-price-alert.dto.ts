import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsUUID, Length, Min } from "class-validator";

export class CreatePriceAlertDto {
  @ApiProperty()
  @IsUUID("4")
  device_variant_id!: string;

  @ApiProperty({ example: 999 })
  @IsNumber()
  @Min(0.01)
  target_price!: number;

  @ApiProperty({ example: "USD" })
  @IsString()
  @Length(3, 3)
  currency_code!: string;

  @ApiProperty({ example: "US" })
  @IsString()
  @Length(2, 2)
  region_code!: string;
}
