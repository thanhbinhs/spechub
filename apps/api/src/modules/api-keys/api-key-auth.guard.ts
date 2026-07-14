import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ApiKeysService, type AuthenticatedApiKey } from "./api-keys.service";

export type ApiKeyRequest = FastifyRequest & {
  apiKey?: AuthenticatedApiKey;
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

    request.apiKey = await this.apiKeysService.authorize(header, "catalog:read");
    return true;
  }
}
