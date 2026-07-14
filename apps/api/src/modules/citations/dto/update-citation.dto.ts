import { PartialType } from "@nestjs/swagger";
import { CreateCitationDto } from "./create-citation.dto";

export class UpdateCitationDto extends PartialType(CreateCitationDto) {}
