import { once } from "node:events";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { USER_ROLES } from "../../common/constants";
import { Public } from "../../common/decorators/public.decorator";
import { RawResponse } from "../../common/decorators/raw-response.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AiService, type AiStreamEvent } from "./ai.service";
import { DeviceRecommendationService } from "./device-recommendation.service";
import { AskAiDto } from "./dto/ask-ai.dto";
import { QueryAiSearchDto } from "./dto/query-ai-search.dto";
import { RecommendDevicesDto } from "./dto/recommend-devices.dto";
import { ResearchHardwareDto } from "./dto/research-hardware.dto";
import { HardwareResearchService } from "./hardware-research.service";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly hardwareResearchService: HardwareResearchService,
    private readonly deviceRecommendationService: DeviceRecommendationService,
  ) {}

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
  @Post("recommendations")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Recommend devices from budget, use cases, and hard requirements",
  })
  recommendDevices(@Body() dto: RecommendDevicesDto) {
    return this.deviceRecommendationService.recommend(dto);
  }

  @Public()
  @RawResponse()
  @Post("ask/stream")
  @HttpCode(HttpStatus.OK)
  @ApiProduces("application/x-ndjson")
  @ApiOperation({
    summary: "Stream a grounded AI answer as newline-delimited events",
  })
  async askStream(
    @Body() dto: AskAiDto,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const abortController = new AbortController();
    const abort = () => {
      if (!reply.raw.writableEnded) {
        abortController.abort(new Error("client disconnected"));
      }
    };
    request.raw.once("aborted", abort);
    reply.raw.once("close", abort);
    const inheritedHeaders = reply.getHeaders();
    reply.hijack();
    for (const [name, value] of Object.entries(inheritedHeaders)) {
      if (value !== undefined) reply.raw.setHeader(name, value);
    }
    reply.raw.statusCode = HttpStatus.OK;
    reply.raw.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no");
    reply.raw.flushHeaders();

    const emit = async (event: AiStreamEvent) => {
      if (abortController.signal.aborted || reply.raw.writableEnded) return;
      const canContinue = reply.raw.write(`${JSON.stringify(event)}\n`);
      if (!canContinue) {
        await once(reply.raw, "drain", { signal: abortController.signal });
      }
    };

    try {
      await this.aiService.streamAsk(dto, emit, abortController.signal);
    } catch (error) {
      if (!abortController.signal.aborted) {
        await emit({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể hoàn tất câu trả lời AI.",
        });
      }
    } finally {
      request.raw.off("aborted", abort);
      reply.raw.off("close", abort);
      if (!reply.raw.writableEnded) reply.raw.end();
    }
  }

  @Public()
  @Get("search")
  @ApiOperation({ summary: "Retrieve relevant catalog chunks for a query" })
  search(@Query() query: QueryAiSearchDto) {
    return this.aiService.search(query);
  }

  @Public()
  @Post("research/hardware/:kind/:slug")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Score device-level module usage from benchmarks or configuration data",
  })
  researchHardware(
    @Param("kind") kind: string,
    @Param("slug") slug: string,
    @Body() dto: ResearchHardwareDto,
  ) {
    return this.hardwareResearchService.research(kind, slug, dto);
  }

  @Public()
  @Get("embeddings/stats")
  @ApiOperation({ summary: "AI embedding index stats" })
  getEmbeddingStats() {
    return this.aiService.getEmbeddingStats();
  }

  @Post("embeddings/index-knowledge-base")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({
    summary:
      "Rebuild AI embeddings from all approved internal knowledge sources",
  })
  indexKnowledgeBase() {
    return this.aiService.indexKnowledgeBase();
  }

  @Post("embeddings/index-device-models")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({ summary: "Index device models into pgvector embeddings" })
  indexDeviceModels() {
    return this.aiService.indexDeviceModels();
  }

  @Post("embeddings/index-raw-pages")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({
    summary: "Index reviewed raw pages into pgvector embeddings",
  })
  indexRawPages() {
    return this.aiService.indexRawPages();
  }
}
