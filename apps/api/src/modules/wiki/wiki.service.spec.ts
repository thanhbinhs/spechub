import { BadRequestException } from "@nestjs/common";
import { QueryWikiArticlesDto } from "./dto/query-wiki-articles.dto";
import { WikiService } from "./wiki.service";

describe("WikiService", () => {
  const transaction = {
    wiki_articles: {
      create: jest.fn(),
      update: jest.fn(),
    },
    wiki_revisions: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = {
    languages: {
      findFirst: jest.fn(),
    },
    citations: {
      count: jest.fn(),
    },
    wiki_articles: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    wiki_revisions: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: WikiService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
    );
    service = new WikiService(prisma as any);
  });

  it("only returns a published article in the requested active language", async () => {
    prisma.languages.findFirst.mockResolvedValue({ id: 1, code: "vi" });
    prisma.wiki_articles.findFirst.mockResolvedValue({
      id: "article-1",
      slug: "iphone-16-pro",
      status: "published",
    });

    await expect(
      service.findPublishedBySlug("iphone-16-pro", "vi"),
    ).resolves.toEqual({
      data: {
        id: "article-1",
        slug: "iphone-16-pro",
        status: "published",
      },
    });

    expect(prisma.wiki_articles.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "iphone-16-pro",
          language_id: 1,
          status: "published",
          deleted_at: null,
        }),
      }),
    );
    expect(prisma.wiki_articles.update).toHaveBeenCalledWith({
      where: { id: "article-1" },
      data: { view_count: { increment: 1 } },
    });
  });

  it("creates an initial revision and attaches only validated citations", async () => {
    prisma.languages.findFirst.mockResolvedValue({ id: 1, code: "vi" });
    prisma.citations.count.mockResolvedValue(1);
    transaction.wiki_articles.create.mockResolvedValue({ id: "article-1" });
    transaction.wiki_revisions.create.mockResolvedValue({ id: "revision-1" });
    transaction.wiki_articles.update.mockResolvedValue({ id: "article-1" });

    await expect(
      service.create(
        {
          entity_table: "device_models",
          entity_id: "device-1",
          title: "iPhone 16 Pro",
          slug: "iphone-16-pro",
          status: "draft",
          cover_image_url: "https://images.example.com/iphone-16-pro.webp",
          cover_image_alt: "Mặt lưng iPhone 16 Pro màu titan",
          cover_image_caption: "Cụm ba camera trên iPhone 16 Pro.",
          cover_image_credit: "Ảnh: SpecHub",
          citations: [
            {
              citation_id: "f4c07fa6-0b8c-42ec-9de4-d2f275120ce3",
              anchor_key: "display",
            },
          ],
        },
        "user-1",
      ),
    ).resolves.toEqual({ data: { id: "article-1" } });

    expect(transaction.wiki_articles.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cover_image_url: "https://images.example.com/iphone-16-pro.webp",
          cover_image_alt: "Mặt lưng iPhone 16 Pro màu titan",
          cover_image_caption: "Cụm ba camera trên iPhone 16 Pro.",
          cover_image_credit: "Ảnh: SpecHub",
        }),
      }),
    );
    expect(transaction.wiki_revisions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          article_id: "article-1",
          revision_number: 1,
          author_user_id: "user-1",
        }),
      }),
    );
    expect(transaction.wiki_articles.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          current_revision_id: "revision-1",
          citations: {
            create: [
              {
                citation_id: "f4c07fa6-0b8c-42ec-9de4-d2f275120ce3",
                anchor_key: "display",
              },
            ],
          },
        }),
      }),
    );
  });

  it("rejects an invalid revision that does not contain a change", async () => {
    prisma.wiki_articles.findFirst.mockResolvedValue({
      id: "article-1",
      title: "Current title",
      body_markdown: "Current body",
      status: "published",
      published_at: new Date(),
    });

    await expect(
      service.submitRevision("article-1", {}, "contributor-1"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects duplicate citation links before writing", async () => {
    prisma.languages.findFirst.mockResolvedValue({ id: 1, code: "vi" });

    await expect(
      service.create(
        {
          entity_table: "device_models",
          entity_id: "device-1",
          title: "iPhone 16 Pro",
          slug: "iphone-16-pro",
          citations: [
            { citation_id: "citation-1" },
            { citation_id: "citation-1" },
          ],
        },
        "user-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects cover image metadata without a cover image URL", async () => {
    await expect(
      service.create(
        {
          entity_table: "device_models",
          entity_id: "device-1",
          title: "iPhone 16 Pro",
          slug: "iphone-16-pro",
          cover_image_alt: "Mặt lưng iPhone 16 Pro",
        },
        "user-1",
      ),
    ).rejects.toThrow("Cover image metadata requires cover_image_url");
  });

  it("updates cover metadata and clears stale values when the image changes", async () => {
    prisma.wiki_articles.findFirst.mockResolvedValue({
      id: "article-1",
      title: "Current title",
      body_markdown: "Current body",
      status: "draft",
      published_at: null,
      cover_image_url: "https://images.example.com/old.webp",
      cover_image_alt: "Old alternative text",
      cover_image_caption: "Old caption",
      cover_image_credit: "Old credit",
    });
    transaction.wiki_revisions.findFirst.mockResolvedValue({
      revision_number: 1,
    });
    transaction.wiki_revisions.create.mockResolvedValue({ id: "revision-2" });
    transaction.wiki_articles.update.mockResolvedValue({ id: "article-1" });

    await service.update(
      "article-1",
      {
        cover_image_url: "https://images.example.com/new.webp",
        cover_image_alt: "New alternative text",
      },
      "editor-1",
    );

    expect(transaction.wiki_articles.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cover_image_url: "https://images.example.com/new.webp",
          cover_image_alt: "New alternative text",
          cover_image_caption: null,
          cover_image_credit: null,
        }),
      }),
    );
  });

  it("ranks Vietnamese search without diacritics and serializes view counts", async () => {
    prisma.languages.findFirst.mockResolvedValue({ id: 1, code: "vi" });
    prisma.wiki_articles.findMany.mockResolvedValue([
      {
        id: "article-general",
        title: "Checklist mua thiết bị",
        summary: "Kiểm tra màn hình và pin trước khi mua.",
        tags: ["mua-sam"],
        view_count: BigInt(20),
        reading_time_minutes: 3,
        published_at: new Date("2026-07-20"),
        updated_at: new Date("2026-07-20"),
      },
      {
        id: "article-display",
        title: "Cách đọc màn hình OLED",
        summary: "Hướng dẫn đọc độ sáng và màu sắc.",
        tags: ["man-hinh", "oled"],
        view_count: BigInt(10),
        reading_time_minutes: 2,
        published_at: new Date("2026-07-10"),
        updated_at: new Date("2026-07-10"),
      },
    ]);

    const query = Object.assign(new QueryWikiArticlesDto(), {
      q: "man hinh",
      language_code: "vi",
      page: 1,
      pageSize: 10,
    });
    const result = await service.listPublished(query);

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: "article-display",
        view_count: "10",
      }),
    );
    expect(result.meta.total).toBe(2);
    expect(prisma.wiki_articles.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          language_id: 1,
          status: "published",
        }),
      }),
    );
  });
});
