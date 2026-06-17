import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AffiliateService } from "./affiliate.service";

@ApiTags("affiliate")
@Controller("affiliate")
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get("status")
  @ApiOperation({ summary: "Affiliate module scaffold status" })
  getStatus() {
    return this.affiliateService.getStatus();
  }
}
