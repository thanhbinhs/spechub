import { ServiceUnavailableException } from "@nestjs/common";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { StorageSigningService } from "./storage-signing.service";

describe("StorageSigningService", () => {
  const values: Record<string, string> = {
    STORAGE_PROVIDER: "r2",
    STORAGE_S3_ENDPOINT: "https://example.r2.cloudflarestorage.com",
    STORAGE_S3_REGION: "auto",
    STORAGE_S3_BUCKET: "spechub-media",
    STORAGE_S3_ACCESS_KEY_ID: "test-access-key",
    STORAGE_S3_SECRET_ACCESS_KEY: "test-secret-key",
    STORAGE_CDN_BASE_URL: "https://cdn.spechub.test/",
  };
  const config = {
    get: jest.fn((key: string) => values[key]),
  };

  beforeEach(() => {
    config.get.mockClear();
  });

  it("creates a partitioned object key without exposing the original filename", () => {
    const service = new StorageSigningService(config as any);

    const key = service.createObjectKey(
      "device_models",
      "Ảnh sản phẩm FINAL.webp",
      new Date("2026-07-28T00:00:00.000Z"),
    );

    expect(key).toMatch(/^device_models\/2026\/07\/[0-9a-f-]{36}\.webp$/);
    expect(key).not.toContain("FINAL");
  });

  it("creates a short-lived SigV4 PUT URL for the configured bucket", () => {
    const service = new StorageSigningService(config as any);

    const signedUrl = new URL(
      service.createPresignedPutUrl(
        "device_models/2026/07/asset.webp",
        900,
        new Date("2026-07-28T12:34:56.000Z"),
      ),
    );

    expect(signedUrl.origin).toBe("https://example.r2.cloudflarestorage.com");
    expect(signedUrl.pathname).toBe(
      "/spechub-media/device_models/2026/07/asset.webp",
    );
    expect(signedUrl.searchParams.get("X-Amz-Algorithm")).toBe(
      "AWS4-HMAC-SHA256",
    );
    expect(signedUrl.searchParams.get("X-Amz-Date")).toBe("20260728T123456Z");
    expect(signedUrl.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(signedUrl.searchParams.get("X-Amz-Signature")).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it("fails closed when upload credentials are incomplete", () => {
    const service = new StorageSigningService({
      get: (key: string) =>
        key === "STORAGE_S3_ENDPOINT"
          ? "https://storage.example.test"
          : undefined,
    } as any);

    expect(() =>
      service.createPresignedPutUrl("device_models/file.webp"),
    ).toThrow(ServiceUnavailableException);
  });

  it("uses signed local storage when S3 is blank in development", async () => {
    const root = await fs.mkdtemp(join(tmpdir(), "spechub-storage-"));
    const localValues: Record<string, string> = {
      NODE_ENV: "development",
      STORAGE_PROVIDER: "s3-compatible",
      STORAGE_LOCAL_ROOT: root,
      NEXT_PUBLIC_SPECHUB_API_URL: "http://localhost:4000/api/v1",
      AUTH_SECRET: "local-test-secret",
    };
    const service = new StorageSigningService({
      get: (key: string) => localValues[key],
    } as any);
    const now = new Date("2026-07-30T12:00:00.000Z");

    try {
      expect(service.storageMetadata()).toEqual({
        provider: "local",
        bucket: "filesystem",
        cdnBaseUrl: "http://localhost:4000/media",
      });
      const uploadUrl = new URL(
        service.createUploadUrl(
          "media-1",
          "organizations/2026/07/logo.webp",
          900,
          now,
        ),
      );
      expect(uploadUrl.pathname).toBe(
        "/api/v1/admin/catalog-studio/media/uploads/media-1/content",
      );
      const expiresAt = Number(uploadUrl.searchParams.get("expires"));
      const token = uploadUrl.searchParams.get("token") ?? "";
      expect(() =>
        service.verifyLocalUploadToken(
          "media-1",
          "organizations/2026/07/logo.webp",
          expiresAt,
          token,
          new Date("2026-07-30T12:01:00.000Z"),
        ),
      ).not.toThrow();

      const content = Buffer.from("local-image");
      const saved = await service.writeLocalObject(
        "organizations/2026/07/logo.webp",
        Readable.from(content),
        content.length,
        1024,
      );
      expect(saved.publicUrl).toBe(
        "http://localhost:4000/media/organizations/2026/07/logo.webp",
      );
      await expect(
        fs.readFile(join(root, "organizations/2026/07/logo.webp")),
      ).resolves.toEqual(content);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
