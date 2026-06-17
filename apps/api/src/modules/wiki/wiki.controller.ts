import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { WikiService } from "./wiki.service";

@ApiTags("wiki")
@Controller("wiki")
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get("status")
  @ApiOperation({ summary: "Wiki module scaffold status" })
  getStatus() {
    return this.wikiService.getStatus();
  }
}
