import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateHardwareModuleDto } from "./create-hardware-module.dto";

export class UpdateHardwareModuleDto extends PartialType(
  OmitType(CreateHardwareModuleDto, ["kind"] as const),
) {}
