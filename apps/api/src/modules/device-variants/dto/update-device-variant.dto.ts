import { PartialType } from "@nestjs/swagger";
import { CreateDeviceVariantDto } from "./create-device-variant.dto";

export class UpdateDeviceVariantDto extends PartialType(CreateDeviceVariantDto) {}
