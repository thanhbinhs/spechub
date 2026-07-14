import { PartialType } from "@nestjs/swagger";
import { CreateAffiliatePartnerDto } from "./create-affiliate-partner.dto";

export class UpdateAffiliatePartnerDto extends PartialType(
  CreateAffiliatePartnerDto,
) {}
