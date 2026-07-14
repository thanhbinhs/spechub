import { BadRequestException } from "@nestjs/common";
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
      async (callback: (tx: typeof transaction) => unknown) => callback(transaction),
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
});
