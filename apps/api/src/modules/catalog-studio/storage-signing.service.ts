import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  promises as fs,
} from "node:fs";
import { extname, dirname, resolve, sep } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

type S3StorageConfig = {
  kind: "s3";
  provider: string;
  endpoint: URL;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnBaseUrl: string | null;
};

type LocalStorageConfig = {
  kind: "local";
  provider: "local";
  bucket: "filesystem";
  root: string;
  apiBaseUrl: string;
  publicBaseUrl: string;
  signingSecret: string;
};

type StorageConfig = S3StorageConfig | LocalStorageConfig;

@Injectable()
export class StorageSigningService {
  constructor(private readonly config: ConfigService) {}

  createObjectKey(entityTable: string, filename: string, now = new Date()) {
    const safeEntity = entityTable
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const extension = extname(filename)
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "")
      .slice(0, 12);
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `${safeEntity || "catalog"}/${year}/${month}/${randomUUID()}${extension}`;
  }

  storageMetadata() {
    const storage = this.resolveConfig();
    return {
      provider: storage.provider,
      bucket: storage.bucket,
      cdnBaseUrl:
        storage.kind === "local"
          ? storage.publicBaseUrl
          : storage.cdnBaseUrl,
    };
  }

  createPresignedPutUrl(
    objectKey: string,
    expiresSeconds = 900,
    now = new Date(),
  ) {
    const storage = this.requireS3Config();
    const amzDate = this.amzDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${storage.region}/s3/aws4_request`;
    const pathname = this.canonicalPath(
      storage.endpoint.pathname,
      storage.bucket,
      objectKey,
    );
    const query: Record<string, string> = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${storage.accessKeyId}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expiresSeconds),
      "X-Amz-SignedHeaders": "host",
    };
    const canonicalQuery = this.canonicalQuery(query);
    const canonicalRequest = [
      "PUT",
      pathname,
      canonicalQuery,
      `host:${storage.endpoint.host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      this.sha256(canonicalRequest),
    ].join("\n");
    const signingKey = this.signingKey(
      storage.secretAccessKey,
      dateStamp,
      storage.region,
    );
    const signature = createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");
    return `${storage.endpoint.origin}${pathname}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }

  createUploadUrl(
    mediaAssetId: string,
    objectKey: string,
    expiresSeconds = 900,
    now = new Date(),
  ) {
    const storage = this.resolveConfig();
    if (storage.kind === "s3") {
      return this.createPresignedPutUrl(objectKey, expiresSeconds, now);
    }
    const expiresAt = Math.floor(now.getTime() / 1000) + expiresSeconds;
    const token = this.localUploadToken(
      storage.signingSecret,
      mediaAssetId,
      objectKey,
      expiresAt,
    );
    const query = new URLSearchParams({
      expires: String(expiresAt),
      token,
    });
    return `${storage.apiBaseUrl}/admin/catalog-studio/media/uploads/${encodeURIComponent(mediaAssetId)}/content?${query.toString()}`;
  }

  verifyLocalUploadToken(
    mediaAssetId: string,
    objectKey: string,
    expiresAt: number,
    token: string,
    now = new Date(),
  ) {
    const storage = this.requireLocalConfig();
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (!Number.isSafeInteger(expiresAt) || expiresAt < nowSeconds) {
      throw new BadRequestException(
        "URL tải tệp đã hết hạn. Hãy chọn lại tệp để tải lên.",
      );
    }
    const expected = this.localUploadToken(
      storage.signingSecret,
      mediaAssetId,
      objectKey,
      expiresAt,
    );
    const suppliedBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expected);
    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      throw new BadRequestException("Chữ ký tải tệp không hợp lệ.");
    }
  }

  async writeLocalObject(
    objectKey: string,
    body: Readable,
    expectedBytes: number,
    maxBytes: number,
  ) {
    const storage = this.requireLocalConfig();
    const target = this.localObjectPath(storage.root, objectKey);
    mkdirSync(dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.part`;
    let receivedBytes = 0;
    const checksum = createHash("sha256");
    const meter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        receivedBytes += chunk.length;
        if (receivedBytes > maxBytes) {
          callback(
            new PayloadTooLargeException(
              `Tệp tải lên vượt quá giới hạn ${maxBytes} byte.`,
            ),
          );
          return;
        }
        checksum.update(chunk);
        callback(null, chunk);
      },
    });

    try {
      await pipeline(
        body,
        meter,
        createWriteStream(temporary, { flags: "wx" }),
      );
      if (receivedBytes !== expectedBytes) {
        throw new BadRequestException(
          `Kích thước tệp không khớp: nhận ${receivedBytes} byte, dự kiến ${expectedBytes} byte.`,
        );
      }
      await fs.rename(temporary, target);
    } catch (error) {
      await fs.unlink(temporary).catch(() => undefined);
      throw error;
    }

    return {
      receivedBytes,
      checksumSha256: checksum.digest("hex"),
      publicUrl: this.publicUrl(objectKey),
    };
  }

  publicUrl(objectKey: string) {
    const storage = this.resolveConfig();
    const baseUrl =
      storage.kind === "local"
        ? storage.publicBaseUrl
        : storage.cdnBaseUrl;
    if (!baseUrl) return null;
    return `${baseUrl}/${objectKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }

  localServingConfig() {
    if (this.hasS3ConnectionDetails()) return null;
    const provider =
      this.config.get<string>("STORAGE_PROVIDER")?.trim().toLowerCase() ?? "";
    if (
      this.config.get<string>("NODE_ENV") === "production" &&
      provider !== "local"
    ) {
      return null;
    }
    const storage = this.localConfig();
    return {
      root: storage.root,
      publicBaseUrl: storage.publicBaseUrl,
    };
  }

  localObjectExists(objectKey: string) {
    const storage = this.requireLocalConfig();
    return existsSync(this.localObjectPath(storage.root, objectKey));
  }

  private resolveConfig(): StorageConfig {
    const endpoint = this.config.get<string>("STORAGE_S3_ENDPOINT")?.trim();
    const bucket = this.config.get<string>("STORAGE_S3_BUCKET")?.trim();
    const accessKeyId = this.config
      .get<string>("STORAGE_S3_ACCESS_KEY_ID")
      ?.trim();
    const secretAccessKey = this.config
      .get<string>("STORAGE_S3_SECRET_ACCESS_KEY")
      ?.trim();
    if (!endpoint && !accessKeyId && !secretAccessKey) {
      const provider =
        this.config.get<string>("STORAGE_PROVIDER")?.trim().toLowerCase() ?? "";
      if (
        this.config.get<string>("NODE_ENV") !== "production" ||
        provider === "local"
      ) {
        return this.localConfig();
      }
    }
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        "Storage upload chưa được cấu hình đầy đủ. Hãy cấu hình toàn bộ STORAGE_S3_ENDPOINT, STORAGE_S3_BUCKET, STORAGE_S3_ACCESS_KEY_ID và STORAGE_S3_SECRET_ACCESS_KEY; hoặc dùng STORAGE_PROVIDER=local.",
      );
    }
    return {
      kind: "s3",
      provider:
        this.config.get<string>("STORAGE_PROVIDER")?.trim() || "s3-compatible",
      endpoint: new URL(endpoint),
      region: this.config.get<string>("STORAGE_S3_REGION")?.trim() || "auto",
      bucket,
      accessKeyId,
      secretAccessKey,
      cdnBaseUrl:
        this.config.get<string>("STORAGE_CDN_BASE_URL")?.replace(/\/+$/, "") ||
        null,
    };
  }

  private requireS3Config() {
    const storage = this.resolveConfig();
    if (storage.kind !== "s3") {
      throw new ServiceUnavailableException(
        "Kho S3 chưa được cấu hình cho thao tác này.",
      );
    }
    return storage;
  }

  private requireLocalConfig() {
    const storage = this.resolveConfig();
    if (storage.kind !== "local") {
      throw new BadRequestException(
        "URL này chỉ dành cho chế độ lưu tệp cục bộ.",
      );
    }
    return storage;
  }

  private localConfig(): LocalStorageConfig {
    const port = this.config.get<string>("PORT")?.trim() || "4000";
    const apiBaseUrl = (
      this.config.get<string>("STORAGE_LOCAL_API_BASE_URL")?.trim() ||
      this.config.get<string>("NEXT_PUBLIC_SPECHUB_API_URL")?.trim() ||
      `http://localhost:${port}/api/v1`
    ).replace(/\/+$/, "");
    const publicBaseUrl = (
      this.config.get<string>("STORAGE_LOCAL_PUBLIC_URL")?.trim() ||
      `${new URL(apiBaseUrl).origin}/media`
    ).replace(/\/+$/, "");
    const signingSecret =
      this.config.get<string>("STORAGE_LOCAL_SIGNING_SECRET")?.trim() ||
      this.config.get<string>("AUTH_SECRET")?.trim() ||
      this.config.get<string>("JWT_SECRET")?.trim();
    if (!signingSecret) {
      throw new ServiceUnavailableException(
        "Thiếu khóa ký cho upload cục bộ. Hãy cấu hình AUTH_SECRET hoặc STORAGE_LOCAL_SIGNING_SECRET.",
      );
    }
    return {
      kind: "local",
      provider: "local",
      bucket: "filesystem",
      root: resolve(
        this.config.get<string>("STORAGE_LOCAL_ROOT")?.trim() ||
          ".local-storage",
      ),
      apiBaseUrl,
      publicBaseUrl,
      signingSecret,
    };
  }

  private hasS3ConnectionDetails() {
    return Boolean(
      this.config.get<string>("STORAGE_S3_ENDPOINT")?.trim() ||
        this.config.get<string>("STORAGE_S3_ACCESS_KEY_ID")?.trim() ||
        this.config.get<string>("STORAGE_S3_SECRET_ACCESS_KEY")?.trim(),
    );
  }

  private localUploadToken(
    secret: string,
    mediaAssetId: string,
    objectKey: string,
    expiresAt: number,
  ) {
    return createHmac("sha256", secret)
      .update(`${mediaAssetId}\n${objectKey}\n${expiresAt}`)
      .digest("hex");
  }

  private localObjectPath(root: string, objectKey: string) {
    const target = resolve(root, objectKey);
    const rootPrefix = root.endsWith(sep) ? root : `${root}${sep}`;
    if (!target.startsWith(rootPrefix)) {
      throw new BadRequestException("Đường dẫn tệp lưu trữ không hợp lệ.");
    }
    return target;
  }

  private canonicalPath(prefix: string, bucket: string, objectKey: string) {
    const segments = [prefix, bucket, objectKey]
      .join("/")
      .split("/")
      .filter(Boolean)
      .map((segment) => this.awsEncode(segment));
    return `/${segments.join("/")}`;
  }

  private canonicalQuery(query: Record<string, string>) {
    return Object.entries(query)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${this.awsEncode(key)}=${this.awsEncode(value)}`)
      .join("&");
  }

  private awsEncode(value: string) {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }

  private amzDate(date: Date) {
    return date
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, "")
      .replace("Z", "Z");
  }

  private sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private signingKey(secret: string, date: string, region: string) {
    const dateKey = createHmac("sha256", `AWS4${secret}`).update(date).digest();
    const regionKey = createHmac("sha256", dateKey).update(region).digest();
    const serviceKey = createHmac("sha256", regionKey).update("s3").digest();
    return createHmac("sha256", serviceKey).update("aws4_request").digest();
  }
}
