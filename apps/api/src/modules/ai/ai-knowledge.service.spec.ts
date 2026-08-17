import { AiKnowledgeService } from "./ai-knowledge.service";

describe("AiKnowledgeService", () => {
  it("turns approved relational catalog rows into readable, safe chunks", async () => {
    const queryRaw = jest.fn(async (sql: string) => {
      if (sql.includes('FROM "device_models"')) {
        return [
          {
            record: {
              id: "model-1",
              name: "iPhone 16 Pro",
              slug: "iphone-16-pro",
              deleted_at: null,
            },
          },
        ];
      }
      if (sql.includes('FROM "device_variants"')) {
        return [
          {
            record: {
              id: "variant-1",
              device_model_id: "model-1",
              variant_name: "256GB",
              sku_code: "A3293",
              deleted_at: null,
            },
          },
        ];
      }
      if (sql.includes('FROM "cpus"')) {
        return [
          {
            record: {
              id: "cpu-1",
              name: "Apple Avalanche",
              slug: "apple-avalanche",
              core_count: 2,
            },
          },
        ];
      }
      if (sql.includes('FROM "variant_cpus"')) {
        return [
          {
            record: {
              id: "link-1",
              device_variant_id: "variant-1",
              cpu_id: "cpu-1",
              cpu_role: "performance",
            },
          },
        ];
      }
      if (sql.includes('FROM "affiliate_partners"')) {
        return [
          {
            record: {
              id: "partner-1",
              name: "Trusted shop",
              slug: "trusted-shop",
              commission_rate: "12.50",
              is_active: true,
              is_trusted: true,
            },
          },
        ];
      }
      return [];
    });
    const service = new AiKnowledgeService({
      $queryRawUnsafe: queryRaw,
    } as never);

    const snapshot = await service.createSnapshot();
    const relationChunk = snapshot.chunks.find(
      (chunk) => chunk.entityId === "link-1",
    );
    const hardwareChunk = snapshot.chunks.find(
      (chunk) => chunk.entityId === "cpu-1",
    );
    const partnerChunk = snapshot.chunks.find(
      (chunk) => chunk.entityId === "partner-1",
    );

    expect(relationChunk?.chunkText).toContain("iPhone 16 Pro — 256GB");
    expect(relationChunk?.chunkText).toContain("Apple Avalanche");
    expect(hardwareChunk).toMatchObject({
      entityType: "hardware_module",
      slug: "cpu/apple-avalanche",
    });
    expect(partnerChunk?.chunkText).not.toContain("commission");
    expect(snapshot.recordsByType).toMatchObject({
      device_variant: 1,
      hardware_module: 1,
    });
  });

  it("queries only the explicit approved knowledge allowlist", async () => {
    const queryRaw = jest.fn(async (_sql: string) => []);
    const service = new AiKnowledgeService({
      $queryRawUnsafe: queryRaw,
    } as never);

    await service.createSnapshot();
    const sql = queryRaw.mock.calls.map(([statement]) => statement).join("\n");

    expect(sql).toContain('FROM "wiki_articles"');
    expect(sql).toContain("record.status = 'published'");
    expect(sql).not.toContain('FROM "users"');
    expect(sql).not.toContain('FROM "api_keys"');
    expect(sql).not.toContain('FROM "catalog_drafts"');
    expect(sql).not.toContain('FROM "billing_audit_logs"');
  });
});
