import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";
import { ApiKeysService } from "./api-keys.service";

@ApiTags("api-keys")
@ApiBearerAuth()
@Controller("api-keys")
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: "List my B2B API keys (without secrets)" })
  list(@CurrentUser("id") userId: string) {
    return this.apiKeysService.list(userId);
  }

  @Post()
  @ApiOperation({ summary: "Create a B2B API key; the secret is returned once" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(userId, dto);
  }

  @Post(":id/rotate")
  @ApiOperation({ summary: "Revoke an API key and return a replacement secret" })
  rotate(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.rotate(userId, id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Revoke a B2B API key" })
  revoke(
    @CurrentUser("id") userId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.revoke(userId, id);
  }
}
