import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { CreateDeviceModelDto } from "../../device-models/dto/create-device-model.dto";
import { CreateDeviceVariantDto } from "./create-device-variant.dto";

export class CreateInitialDeviceVariantDto extends OmitType(
  CreateDeviceVariantDto,
  ["device_model_id"] as const,
) {}

export class CreateDeviceBundleDto {
  @ApiProperty({ type: CreateDeviceModelDto })
  @ValidateNested()
  @Type(() => CreateDeviceModelDto)
  model!: CreateDeviceModelDto;

  @ApiProperty({ type: CreateInitialDeviceVariantDto })
  @ValidateNested()
  @Type(() => CreateInitialDeviceVariantDto)
  variant!: CreateInitialDeviceVariantDto;
}
