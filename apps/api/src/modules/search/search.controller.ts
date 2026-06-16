import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { QuerySearchDto } from "./dto/query-search.dto";
import { SearchService } from "./search.service";

@Public()
@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: "Search device models with keyword and filters" })
  search(@Query() query: QuerySearchDto) {
    return this.searchService.search(query);
  }
}
