import { PartialType } from "@nestjs/swagger";
import { CreateDeviceCategoryDto } from "./create-device-category.dto";

export class UpdateDeviceCategoryDto extends PartialType(CreateDeviceCategoryDto) {}
