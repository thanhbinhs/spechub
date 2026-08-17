import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ApiKeysService, type AuthorizedApiKey } from "./api-keys.service";

export type ApiKeyRequest = FastifyRequest & {
  apiKey?: AuthorizedApiKey;
};

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();
    const header = request.headers["x-api-key"];
    if (typeof header !== "string") {
      throw new UnauthorizedException("X-API-Key header is required");
    }

    const apiKey = await this.apiKeysService.authorize(header, "catalog:read");
    request.apiKey = apiKey;

    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const secondsUntilReset = Math.max(
      0,
      Math.ceil((apiKey.rate_limit_reset_at.getTime() - Date.now()) / 1_000),
    );
    reply
      .header("RateLimit-Limit", String(apiKey.rate_limit_per_minute))
      .header("RateLimit-Remaining", String(apiKey.rate_limit_remaining))
      .header("RateLimit-Reset", String(secondsUntilReset));
    if (apiKey.monthly_quota !== null && apiKey.monthly_quota_remaining !== undefined) {
      reply.header("X-Monthly-Quota-Remaining", String(apiKey.monthly_quota_remaining));
    }
    return true;
  }
}
