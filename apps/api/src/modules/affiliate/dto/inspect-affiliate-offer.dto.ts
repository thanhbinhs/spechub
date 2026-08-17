import { ApiProperty } from "@nestjs/swagger";
import { IsUrl, IsUUID } from "class-validator";

export class InspectAffiliateOfferDto {
  @ApiProperty()
  @IsUUID("4")
  partner_id!: string;

  @ApiProperty({ example: "https://cellphones.com.vn/iphone-16-pro.html" })
  @IsUrl({ require_tld: false })
  product_url!: string;
}
