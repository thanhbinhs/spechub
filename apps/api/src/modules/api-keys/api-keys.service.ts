import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@spechub/database";
import { PrismaService } from "../../prisma/prisma.service";
import {
  API_KEY_SCOPES,
  type ApiKeyScope,
  CreateApiKeyDto,
} from "./dto/create-api-key.dto";

const API_KEY_METADATA_SELECT = {
  id: true,
  name: true,
  key_prefix: true,
  scopes: true,
  rate_limit_per_minute: true,
  monthly_quota: true,
  is_active: true,
  last_used_at: true,
  expires_at: true,
  revoked_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.api_keysSelect;

const API_KEY_AUTH_SELECT = {
  id: true,
  user_id: true,
  key_hash: true,
  scopes: true,
  rate_limit_per_minute: true,
  monthly_quota: true,
  is_active: true,
  expires_at: true,
  revoked_at: true,
  user: {
    select: {
      is_active: true,
      subscription: {
        select: {
          plan: {
            select: { features: true },
          },
        },
      },
    },
  },
} satisfies Prisma.api_keysSelect;

export type ApiKeyMetadata = Prisma.api_keysGetPayload<{
  select: typeof API_KEY_METADATA_SELECT;
}>;

export type AuthenticatedApiKey = Pick<
  Prisma.api_keysGetPayload<{ select: typeof API_KEY_AUTH_SELECT }>,
  "id" | "user_id" | "scopes" | "rate_limit_per_minute" | "monthly_quota"
>;

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<{ data: ApiKeyMetadata[] }> {
    const keys = await this.prisma.api_keys.findMany({
      where: { user_id: userId },
      select: API_KEY_METADATA_SELECT,
      orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
    });
    return { data: keys };
  }

  async create(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ data: ApiKeyMetadata & { key: string } }> {
    await this.ensureApiAccess(userId);
    return this.issueKey(userId, {
      name: dto.name,
      scopes: dto.scopes ?? [...API_KEY_SCOPES],
      rate_limit_per_minute: dto.rate_limit_per_minute ?? 60,
      monthly_quota: dto.monthly_quota,
      expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
    });
  }

  async revoke(userId: string, id: string) {
    await this.findOwnedKey(userId, id);
    await this.prisma.api_keys.update({
      where: { id },
      data: { is_active: false, revoked_at: new Date() },
    });
    return { data: { id, revoked: true } };
  }

  async rotate(
    userId: string,
    id: string,
  ): Promise<{ data: ApiKeyMetadata & { key: string } }> {
    const current = await this.findOwnedKey(userId, id);
    await this.ensureApiAccess(userId);
    await this.prisma.api_keys.update({
      where: { id },
      data: { is_active: false, revoked_at: new Date() },
    });

    return this.issueKey(userId, {
      name: current.name,
      scopes: this.readScopes(current.scopes),
      rate_limit_per_minute: current.rate_limit_per_minute,
      monthly_quota: current.monthly_quota ?? undefined,
      expires_at: current.expires_at ?? undefined,
    });
  }

  async authorize(
    rawKey: string,
    requiredScope: ApiKeyScope,
  ): Promise<AuthenticatedApiKey> {
    if (!rawKey.startsWith("sph_b2b_") || rawKey.length < 40) {
      throw new UnauthorizedException("Invalid API key");
    }

    const key = await this.prisma.api_keys.findUnique({
      where: { key_hash: this.hashKey(rawKey) },
      select: API_KEY_AUTH_SELECT,
    });
    if (
      !key ||
      !key.is_active ||
      key.revoked_at ||
      (key.expires_at && key.expires_at <= new Date()) ||
      !key.user.is_active
    ) {
      throw new UnauthorizedException("Invalid API key");
    }

    const scopes = this.readScopes(key.scopes);
    if (!scopes.includes(requiredScope)) {
      throw new ForbiddenException("API key does not include the required scope");
    }
    if (!this.hasApiAccess(key.user.subscription?.plan.features)) {
      throw new ForbiddenException("API access is not enabled for this subscription");
    }

    const authenticated: AuthenticatedApiKey = {
      id: key.id,
      user_id: key.user_id,
      scopes,
      rate_limit_per_minute: key.rate_limit_per_minute,
      monthly_quota: key.monthly_quota,
    };
    await this.recordUsage(authenticated);
    return authenticated;
  }

  private async issueKey(
    userId: string,
    input: {
      name: string;
      scopes: ApiKeyScope[];
      rate_limit_per_minute: number;
      monthly_quota?: number;
      expires_at?: Date;
    },
  ): Promise<{ data: ApiKeyMetadata & { key: string } }> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const key = `sph_b2b_${randomBytes(32).toString("base64url")}`;
      const keyPrefix = key.slice(0, 20);
      try {
        const created = await this.prisma.api_keys.create({
          data: {
            user_id: userId,
            name: input.name.trim(),
            key_prefix: keyPrefix,
            key_hash: this.hashKey(key),
            scopes: input.scopes,
            rate_limit_per_minute: input.rate_limit_per_minute,
            monthly_quota: input.monthly_quota,
            expires_at: input.expires_at,
          },
          select: API_KEY_METADATA_SELECT,
        });
        return { data: { ...created, key } };
      } catch (error) {
        if (attempt === 2 || !this.isUniqueConstraint(error)) throw error;
      }
    }

    throw new Error("Could not generate a unique API key");
  }

  private async findOwnedKey(userId: string, id: string) {
    const key = await this.prisma.api_keys.findFirst({
      where: { id, user_id: userId },
      select: {
        id: true,
        name: true,
        scopes: true,
        rate_limit_per_minute: true,
        monthly_quota: true,
        expires_at: true,
      },
    });
    if (!key) throw new NotFoundException(`API key ${id} not found`);
    return key;
  }

  private async ensureApiAccess(userId: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { user_id: userId },
      select: {
        plan: {
          select: { features: true },
        },
      },
    });
    if (!this.hasApiAccess(subscription?.plan.features)) {
      throw new ForbiddenException("API keys require a subscription with API access");
    }
  }

  private async recordUsage(key: AuthenticatedApiKey) {
    const now = new Date();
    const minuteStart = new Date(now);
    minuteStart.setUTCSeconds(0, 0);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const limitViolation = await this.prisma.$transaction(async (tx) => {
      const usage = await tx.api_key_usage.upsert({
        where: {
          api_key_id_bucket_start: {
            api_key_id: key.id,
            bucket_start: minuteStart,
          },
        },
        create: {
          api_key_id: key.id,
          bucket_start: minuteStart,
          request_count: 1,
        },
        update: {
          request_count: { increment: 1 },
        },
        select: { request_count: true },
      });

      if (usage.request_count > key.rate_limit_per_minute) return "rate";
      if (key.monthly_quota) {
        const monthlyUsage = await tx.api_key_usage.aggregate({
          where: { api_key_id: key.id, bucket_start: { gte: monthStart } },
          _sum: { request_count: true },
        });
        if ((monthlyUsage._sum.request_count ?? 0) > key.monthly_quota) {
          return "quota";
        }
      }

      await tx.api_keys.update({
        where: { id: key.id },
        data: { last_used_at: now },
      });
      return null;
    });

    if (limitViolation === "rate") {
      throw new HttpException("API key rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }
    if (limitViolation === "quota") {
      throw new HttpException("API key monthly quota exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private hasApiAccess(features: unknown) {
    return Boolean(
      features &&
        typeof features === "object" &&
        !Array.isArray(features) &&
        (features as Record<string, unknown>).api_access === true,
    );
  }

  private readScopes(value: unknown): ApiKeyScope[] {
    if (!Array.isArray(value)) return [];
    return value.filter((scope): scope is ApiKeyScope =>
      (API_KEY_SCOPES as readonly string[]).includes(scope as string),
    );
  }

  private hashKey(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private isUniqueConstraint(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}
