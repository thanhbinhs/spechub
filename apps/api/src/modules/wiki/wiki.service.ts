import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWikiArticleDto } from "./dto/create-wiki-article.dto";
import { QueryWikiArticlesDto } from "./dto/query-wiki-articles.dto";
import { SubmitWikiRevisionDto } from "./dto/submit-wiki-revision.dto";
import { UpdateWikiArticleDto } from "./dto/update-wiki-article.dto";
import type { AuthUser } from "../../common/decorators/current-user.decorator";

const WIKI_ARTICLE_SELECT = {
  id: true,
  entity_table: true,
  entity_id: true,
  title: true,
  slug: true,
  summary: true,
  body_markdown: true,
  status: true,
  current_revision_id: true,
  view_count: true,
  published_at: true,
  created_at: true,
  updated_at: true,
  language: {
    select: {
      code: true,
      name: true,
    },
  },
  author: {
    select: {
      id: true,
      username: true,
      display_name: true,
      avatar_url: true,
    },
  },
  article_type: true,
  tags: true,
  cover_image_url: true,
  cover_image_alt: true,
  cover_image_caption: true,
  cover_image_credit: true,
  reading_time_minutes: true,
  citations: {
    orderBy: { citation: { published_at: "desc" } },
    select: {
      anchor_key: true,
      citation: {
        select: {
          id: true,
          url: true,
          title: true,
          author: true,
          published_at: true,
          retrieved_at: true,
          excerpt: true,
          source: {
            select: {
              id: true,
              name: true,
              slug: true,
              source_type: true,
              trust_level: true,
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      revisions: true,
    },
  },
} satisfies Prisma.wiki_articlesSelect;

const WIKI_REVISION_SELECT = {
  id: true,
  article_id: true,
  revision_number: true,
  title: true,
  body_markdown: true,
  change_summary: true,
  is_published: true,
  created_at: true,
  author: {
    select: {
      id: true,
      username: true,
      display_name: true,
    },
  },
} satisfies Prisma.wiki_revisionsSelect;

const WIKI_ARTICLE_LIST_SELECT = {
  id: true,
  entity_table: true,
  entity_id: true,
  title: true,
  slug: true,
  summary: true,
  status: true,
  view_count: true,
  published_at: true,
  created_at: true,
  updated_at: true,
  language: {
    select: {
      code: true,
      name: true,
    },
  },
  author: {
    select: {
      id: true,
      username: true,
      display_name: true,
      avatar_url: true,
    },
  },
  article_type: true,
  tags: true,
  cover_image_url: true,
  cover_image_alt: true,
  cover_image_caption: true,
  cover_image_credit: true,
  reading_time_minutes: true,
  _count: {
    select: {
      revisions: true,
    },
  },
} satisfies Prisma.wiki_articlesSelect;

type WikiArticleItemRaw = Prisma.wiki_articlesGetPayload<{
  select: typeof WIKI_ARTICLE_SELECT;
}>;

type WikiArticleListItemRaw = Prisma.wiki_articlesGetPayload<{
  select: typeof WIKI_ARTICLE_LIST_SELECT;
}>;

export type WikiArticleItem = Omit<WikiArticleItemRaw, "view_count"> & {
  view_count: string;
};

export type WikiArticleListItem = Omit<WikiArticleListItemRaw, "view_count"> & {
  view_count: string;
};

export type WikiRevisionItem = Prisma.wiki_revisionsGetPayload<{
  select: typeof WIKI_REVISION_SELECT;
}>;

export type WikiArticleListResult = {
  data: WikiArticleListItem[];
  meta: PaginationMeta;
};

type ArticleWriteData = {
  language_id?: number;
  entity_table?: string;
  entity_id?: string;
  title?: string;
  slug?: string;
  summary?: string | null;
  body_markdown?: string | null;
  article_type?: string;
  tags?: string[];
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  cover_image_caption?: string | null;
  cover_image_credit?: string | null;
  reading_time_minutes?: number;
  status?: string;
  published_at?: Date | null;
};

@Injectable()
export class WikiService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(
    query: QueryWikiArticlesDto,
  ): Promise<WikiArticleListResult> {
    return this.listArticles(query, true);
  }

  async listForModeration(
    query: QueryWikiArticlesDto,
  ): Promise<WikiArticleListResult> {
    return this.listArticles(query, false);
  }

  async findPublishedBySlug(
    slug: string,
    languageCode?: string,
  ): Promise<{ data: WikiArticleItem }> {
    const language = await this.resolveLanguage(languageCode);
    const article = await this.prisma.wiki_articles.findFirst({
      where: {
        slug,
        language_id: language.id,
        status: "published",
        deleted_at: null,
      },
      select: WIKI_ARTICLE_SELECT,
    });

    if (!article) {
      throw new NotFoundException(`Published wiki article '${slug}' not found`);
    }

    await this.prisma.wiki_articles.update({
      where: { id: article.id },
      data: { view_count: { increment: 1 } },
    });

    return { data: this.serializeArticle(article) };
  }

  async create(
    dto: CreateWikiArticleDto,
    actor: Pick<AuthUser, "id" | "role"> | string,
  ): Promise<{ data: WikiArticleItem }> {
    this.validateCoverImageMetadata(
      dto.cover_image_url,
      dto.cover_image_alt,
      dto.cover_image_caption,
      dto.cover_image_credit,
    );
    const authorUserId = typeof actor === "string" ? actor : actor.id;
    const isTrusted =
      typeof actor === "string" || ["admin", "editor"].includes(actor.role);
    if (!isTrusted) this.validateCommunityArticle(dto);
    const requestedStatus = isTrusted ? (dto.status ?? "draft") : "in_review";
    const language = await this.resolveLanguage(dto.language_code);
    const citationLinks = await this.validateCitationLinks(dto.citations);

    const article = await this.prisma.$transaction(async (tx) => {
      const created = await tx.wiki_articles.create({
        data: {
          entity_table: dto.entity_table,
          entity_id: dto.entity_id,
          language_id: language.id,
          title: dto.title,
          slug: dto.slug,
          author_user_id: authorUserId,
          article_type: dto.article_type ?? "guide",
          tags: this.normalizeTags(dto.tags),
          cover_image_url: dto.cover_image_url,
          cover_image_alt: dto.cover_image_alt,
          cover_image_caption: dto.cover_image_caption,
          cover_image_credit: dto.cover_image_credit,
          summary: dto.summary,
          body_markdown: dto.body_markdown,
          reading_time_minutes: this.readingTime(dto.body_markdown),
          status: requestedStatus,
          published_at: requestedStatus === "published" ? new Date() : null,
        },
        select: { id: true },
      });

      const revision = await tx.wiki_revisions.create({
        data: {
          article_id: created.id,
          author_user_id: authorUserId,
          revision_number: 1,
          title: dto.title,
          body_markdown: dto.body_markdown,
          change_summary: dto.change_summary ?? "Initial article",
          is_published: requestedStatus === "published",
        },
        select: { id: true },
      });

      return tx.wiki_articles.update({
        where: { id: created.id },
        data: {
          current_revision_id: revision.id,
          ...(citationLinks.length > 0 && {
            citations: { create: citationLinks },
          }),
        },
        select: WIKI_ARTICLE_SELECT,
      });
    });

    return { data: this.serializeArticle(article) };
  }

  async update(
    id: string,
    dto: UpdateWikiArticleDto,
    authorUserId: string,
  ): Promise<{ data: WikiArticleItem }> {
    const existing = await this.findArticle(id);
    const language = dto.language_code
      ? await this.resolveLanguage(dto.language_code)
      : undefined;
    const citationLinks =
      dto.citations === undefined
        ? undefined
        : await this.validateCitationLinks(dto.citations);
    const coverImageUrl =
      dto.cover_image_url !== undefined
        ? dto.cover_image_url
        : existing.cover_image_url;
    const coverImageChanged =
      dto.cover_image_url !== undefined &&
      dto.cover_image_url !== existing.cover_image_url;
    const coverImageAlt =
      dto.cover_image_alt !== undefined
        ? dto.cover_image_alt
        : coverImageChanged
          ? null
          : existing.cover_image_alt;
    const coverImageCaption =
      dto.cover_image_caption !== undefined
        ? dto.cover_image_caption
        : coverImageChanged
          ? null
          : existing.cover_image_caption;
    const coverImageCredit =
      dto.cover_image_credit !== undefined
        ? dto.cover_image_credit
        : coverImageChanged
          ? null
          : existing.cover_image_credit;
    this.validateCoverImageMetadata(
      coverImageUrl,
      coverImageAlt,
      coverImageCaption,
      coverImageCredit,
    );

    const article = await this.prisma.$transaction(async (tx) => {
      const latestRevision = await tx.wiki_revisions.findFirst({
        where: { article_id: id },
        select: { revision_number: true },
        orderBy: { revision_number: "desc" },
      });
      const nextRevisionNumber = (latestRevision?.revision_number ?? 0) + 1;
      const requestedStatus = dto.status ?? existing.status;
      const writeData: ArticleWriteData = {
        ...(dto.entity_table !== undefined && {
          entity_table: dto.entity_table,
        }),
        ...(dto.entity_id !== undefined && { entity_id: dto.entity_id }),
        ...(language ? { language_id: language.id } : {}),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.article_type !== undefined && {
          article_type: dto.article_type,
        }),
        ...(dto.tags !== undefined && { tags: this.normalizeTags(dto.tags) }),
        ...(dto.cover_image_url !== undefined && {
          cover_image_url: dto.cover_image_url,
        }),
        ...((dto.cover_image_alt !== undefined || coverImageChanged) && {
          cover_image_alt: coverImageAlt,
        }),
        ...((dto.cover_image_caption !== undefined || coverImageChanged) && {
          cover_image_caption: coverImageCaption,
        }),
        ...((dto.cover_image_credit !== undefined || coverImageChanged) && {
          cover_image_credit: coverImageCredit,
        }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.body_markdown !== undefined && {
          body_markdown: dto.body_markdown,
          reading_time_minutes: this.readingTime(dto.body_markdown),
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(requestedStatus === "published" &&
          !existing.published_at && {
            published_at: new Date(),
          }),
      };

      const revision = await tx.wiki_revisions.create({
        data: {
          article_id: id,
          author_user_id: authorUserId,
          revision_number: nextRevisionNumber,
          title: dto.title ?? existing.title,
          body_markdown: dto.body_markdown ?? existing.body_markdown,
          change_summary: dto.change_summary ?? "Article updated",
          is_published: requestedStatus === "published",
        },
        select: { id: true },
      });

      return tx.wiki_articles.update({
        where: { id },
        data: {
          ...writeData,
          current_revision_id: revision.id,
          ...(citationLinks !== undefined && {
            citations: {
              deleteMany: {},
              ...(citationLinks.length > 0 && { create: citationLinks }),
            },
          }),
        },
        select: WIKI_ARTICLE_SELECT,
      });
    });

    return { data: this.serializeArticle(article) };
  }

  async submitRevision(
    articleId: string,
    dto: SubmitWikiRevisionDto,
    authorUserId: string,
  ): Promise<{ data: WikiRevisionItem }> {
    const article = await this.findArticle(articleId);
    if (dto.title === undefined && dto.body_markdown === undefined) {
      throw new BadRequestException(
        "A title or body_markdown change is required",
      );
    }

    const revision = await this.prisma.$transaction(async (tx) => {
      const latestRevision = await tx.wiki_revisions.findFirst({
        where: { article_id: articleId },
        select: { revision_number: true },
        orderBy: { revision_number: "desc" },
      });

      return tx.wiki_revisions.create({
        data: {
          article_id: articleId,
          author_user_id: authorUserId,
          revision_number: (latestRevision?.revision_number ?? 0) + 1,
          title: dto.title ?? article.title,
          body_markdown: dto.body_markdown ?? article.body_markdown,
          change_summary: dto.change_summary ?? "Proposed revision",
          is_published: false,
        },
        select: WIKI_REVISION_SELECT,
      });
    });

    return { data: revision };
  }

  async listRevisions(
    articleId: string,
  ): Promise<{ data: WikiRevisionItem[] }> {
    await this.findArticle(articleId);
    const revisions = await this.prisma.wiki_revisions.findMany({
      where: { article_id: articleId },
      select: WIKI_REVISION_SELECT,
      orderBy: { revision_number: "desc" },
    });

    return { data: revisions };
  }

  async publishRevision(
    articleId: string,
    revisionId: string,
  ): Promise<{ data: WikiArticleItem }> {
    await this.findArticle(articleId);

    const article = await this.prisma.$transaction(async (tx) => {
      const revision = await tx.wiki_revisions.findFirst({
        where: { id: revisionId, article_id: articleId },
        select: {
          id: true,
          title: true,
          body_markdown: true,
        },
      });

      if (!revision) {
        throw new NotFoundException(`Wiki revision ${revisionId} not found`);
      }

      await tx.wiki_revisions.update({
        where: { id: revision.id },
        data: { is_published: true },
      });

      return tx.wiki_articles.update({
        where: { id: articleId },
        data: {
          title: revision.title ?? undefined,
          body_markdown: revision.body_markdown ?? undefined,
          status: "published",
          current_revision_id: revision.id,
          published_at: new Date(),
        },
        select: WIKI_ARTICLE_SELECT,
      });
    });

    return { data: this.serializeArticle(article) };
  }

  async archive(id: string): Promise<{ data: { id: string; archived: true } }> {
    await this.findArticle(id);
    await this.prisma.wiki_articles.update({
      where: { id },
      data: {
        status: "archived",
        deleted_at: new Date(),
      },
    });

    return { data: { id, archived: true } };
  }

  private async listArticles(
    query: QueryWikiArticlesDto,
    publishedOnly: boolean,
  ): Promise<WikiArticleListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const language = query.language_code
      ? await this.resolveLanguage(query.language_code)
      : undefined;
    const q = query.q?.trim();
    const searchPhrases = q ? this.searchPhrases(q) : [];
    const searchTags = q ? this.searchTags(q) : [];
    const where: Prisma.wiki_articlesWhereInput = {
      deleted_at: null,
      ...(publishedOnly
        ? { status: "published" }
        : query.status
          ? { status: query.status }
          : {}),
      ...(query.entity_table && { entity_table: query.entity_table }),
      ...(query.entity_id && { entity_id: query.entity_id }),
      ...(query.article_type && { article_type: query.article_type }),
      ...(query.tag && { tags: { has: query.tag.trim().toLowerCase() } }),
      ...(language && { language_id: language.id }),
      ...(q && {
        OR: [
          ...searchPhrases.flatMap((phrase) => [
            { title: { contains: phrase, mode: "insensitive" as const } },
            { summary: { contains: phrase, mode: "insensitive" as const } },
            {
              body_markdown: {
                contains: phrase,
                mode: "insensitive" as const,
              },
            },
          ]),
          ...(searchTags.length > 0 ? [{ tags: { hasSome: searchTags } }] : []),
        ],
      }),
    };

    if (q) {
      const matchedItems = await this.prisma.wiki_articles.findMany({
        where,
        select: WIKI_ARTICLE_LIST_SELECT,
        take: 1_000,
      });
      const rankedItems = matchedItems.sort((left, right) => {
        const scoreDelta =
          this.searchScore(right, q, searchPhrases, searchTags) -
          this.searchScore(left, q, searchPhrases, searchTags);
        if (scoreDelta !== 0) return scoreDelta;
        if (query.sort === "popular") {
          return Number(right.view_count - left.view_count);
        }
        if (query.sort === "shortest") {
          return left.reading_time_minutes - right.reading_time_minutes;
        }
        if (query.sort === "az") {
          return left.title.localeCompare(right.title, "vi");
        }
        return (
          (right.published_at?.getTime() ?? right.updated_at.getTime()) -
          (left.published_at?.getTime() ?? left.updated_at.getTime())
        );
      });
      const paginatedItems = rankedItems.slice(
        (page - 1) * pageSize,
        page * pageSize,
      );
      return {
        data: paginatedItems.map((item) => this.serializeArticle(item)),
        meta: createPaginationMeta(rankedItems.length, page, pageSize),
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.wiki_articles.findMany({
        where,
        select: WIKI_ARTICLE_LIST_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.articleOrder(query.sort, publishedOnly),
      }),
      this.prisma.wiki_articles.count({ where }),
    ]);

    return {
      data: items.map((item) => this.serializeArticle(item)),
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  private async findArticle(id: string) {
    const article = await this.prisma.wiki_articles.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        title: true,
        body_markdown: true,
        status: true,
        published_at: true,
        cover_image_url: true,
        cover_image_alt: true,
        cover_image_caption: true,
        cover_image_credit: true,
      },
    });

    if (!article) {
      throw new NotFoundException(`Wiki article ${id} not found`);
    }

    return article;
  }

  private async resolveLanguage(code?: string) {
    const language = await this.prisma.languages.findFirst({
      where: code
        ? { code: code.trim().toLowerCase(), is_active: true }
        : { is_default: true, is_active: true },
      select: { id: true, code: true },
      orderBy: { id: "asc" },
    });

    if (!language) {
      throw new BadRequestException(
        code
          ? `Unsupported or inactive language '${code}'`
          : "No default active language is configured",
      );
    }

    return language;
  }

  private async validateCitationLinks(
    citations: CreateWikiArticleDto["citations"] = [],
  ) {
    const distinctIds = [
      ...new Set(citations.map((citation) => citation.citation_id)),
    ];
    if (distinctIds.length !== citations.length) {
      throw new BadRequestException("A citation can only be attached once");
    }

    if (distinctIds.length === 0) return [];

    const count = await this.prisma.citations.count({
      where: { id: { in: distinctIds } },
    });
    if (count !== distinctIds.length) {
      throw new BadRequestException("One or more citations do not exist");
    }

    return citations.map((citation) => ({
      citation_id: citation.citation_id,
      anchor_key: citation.anchor_key,
    }));
  }

  private validateCommunityArticle(dto: CreateWikiArticleDto) {
    if ((dto.summary?.trim().length ?? 0) < 40) {
      throw new BadRequestException(
        "Community articles require a summary of at least 40 characters",
      );
    }
    if ((dto.body_markdown?.trim().length ?? 0) < 300) {
      throw new BadRequestException(
        "Community articles require at least 300 characters of content",
      );
    }
    if ((dto.change_summary?.trim().length ?? 0) < 10) {
      throw new BadRequestException(
        "Explain the purpose of the article in at least 10 characters",
      );
    }
  }

  private normalizeTags(tags: string[] = []) {
    return Array.from(
      new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
    ).slice(0, 8);
  }

  private validateCoverImageMetadata(
    url?: string | null,
    alt?: string | null,
    caption?: string | null,
    credit?: string | null,
  ) {
    if (
      !url &&
      [alt, caption, credit].some(
        (value) => value !== undefined && value !== null,
      )
    ) {
      throw new BadRequestException(
        "Cover image metadata requires cover_image_url",
      );
    }
  }

  private readingTime(markdown?: string | null) {
    const words = markdown?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    return Math.max(1, Math.ceil(words / 220));
  }

  private articleOrder(
    sort: QueryWikiArticlesDto["sort"],
    publishedOnly: boolean,
  ) {
    if (sort === "popular") return [{ view_count: "desc" as const }];
    if (sort === "updated") return [{ updated_at: "desc" as const }];
    if (sort === "oldest") return [{ published_at: "asc" as const }];
    if (sort === "shortest") {
      return [
        { reading_time_minutes: "asc" as const },
        { published_at: "desc" as const },
      ];
    }
    if (sort === "az") return [{ title: "asc" as const }];
    return publishedOnly
      ? [{ published_at: "desc" as const }, { updated_at: "desc" as const }]
      : [{ updated_at: "desc" as const }];
  }

  private searchPhrases(query: string) {
    const normalized = this.normalizeSearchText(query);
    const aliases: Array<[string, string[]]> = [
      ["man hinh", ["màn hình", "display"]],
      ["hieu nang", ["hiệu năng", "benchmark"]],
      ["sac nhanh", ["sạc nhanh", "pin sạc"]],
      ["thoi luong pin", ["thời lượng pin", "pin"]],
      ["may tinh bang", ["máy tính bảng", "tablet"]],
      ["dien thoai", ["điện thoại", "smartphone"]],
      ["may doc sach", ["máy đọc sách", "e ink"]],
      ["tai nghe", ["tai nghe", "âm thanh"]],
      ["ket noi", ["kết nối", "wifi", "bluetooth"]],
      ["do ben", ["độ bền", "kháng nước"]],
    ];
    const phrases = new Set([query.trim()]);

    for (const [needle, values] of aliases) {
      if (normalized.includes(needle)) {
        values.forEach((value) => phrases.add(value));
      }
    }

    return [...phrases].filter(Boolean).slice(0, 8);
  }

  private searchTags(query: string) {
    const normalized = this.normalizeSearchText(query);
    return Array.from(
      new Set([
        normalized.replace(/\s+/g, "-"),
        ...normalized.split(/\s+/).filter((part) => part.length >= 3),
      ]),
    ).slice(0, 8);
  }

  private normalizeSearchText(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  private searchScore(
    article: {
      title: string;
      summary: string | null;
      tags: string[];
    },
    query: string,
    phrases: string[],
    tags: string[],
  ) {
    const normalizedQuery = this.normalizeSearchText(query);
    const title = this.normalizeSearchText(article.title);
    const summary = this.normalizeSearchText(article.summary ?? "");
    const normalizedTags = article.tags.map((tag) =>
      this.normalizeSearchText(tag).replace(/\s+/g, "-"),
    );
    let score = 0;

    if (title === normalizedQuery) score += 160;
    else if (title.includes(normalizedQuery)) score += 100;
    if (summary.includes(normalizedQuery)) score += 35;

    for (const phrase of phrases) {
      const normalizedPhrase = this.normalizeSearchText(phrase);
      if (!normalizedPhrase || normalizedPhrase === normalizedQuery) continue;
      if (title.includes(normalizedPhrase)) score += 70;
      if (summary.includes(normalizedPhrase)) score += 20;
    }

    for (const tag of tags) {
      if (normalizedTags.includes(tag)) score += 45;
    }

    return score;
  }

  private serializeArticle<
    T extends {
      view_count: bigint;
    },
  >(article: T): Omit<T, "view_count"> & { view_count: string } {
    if (typeof article.view_count !== "bigint") {
      return article as unknown as Omit<T, "view_count"> & {
        view_count: string;
      };
    }
    return {
      ...article,
      view_count: article.view_count.toString(),
    };
  }
}
