import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AiService } from "./ai.service";
import { AskAiDto } from "./dto/ask-ai.dto";
import { QueryAiSearchDto } from "./dto/query-ai-search.dto";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Post("ask")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ask a catalog question with RAG citations" })
  ask(@Body() dto: AskAiDto) {
    return this.aiService.ask(dto);
  }

  @Public()
  @Post("chat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Alias for AI ask endpoint" })
  chat(@Body() dto: AskAiDto) {
    return this.aiService.ask(dto);
  }

  @Public()
  @Get("search")
  @ApiOperation({ summary: "Retrieve relevant catalog chunks for a query" })
  search(@Query() query: QueryAiSearchDto) {
    return this.aiService.search(query);
  }

  @Public()
  @Get("embeddings/stats")
  @ApiOperation({ summary: "AI embedding index stats" })
  getEmbeddingStats() {
    return this.aiService.getEmbeddingStats();
  }

  @Post("embeddings/index-device-models")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Index device models into pgvector embeddings" })
  indexDeviceModels() {
    return this.aiService.indexDeviceModels();
  }
}
