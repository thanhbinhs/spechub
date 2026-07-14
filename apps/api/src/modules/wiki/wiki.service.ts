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

export type WikiArticleItem = Prisma.wiki_articlesGetPayload<{
  select: typeof WIKI_ARTICLE_SELECT;
}>;

export type WikiRevisionItem = Prisma.wiki_revisionsGetPayload<{
  select: typeof WIKI_REVISION_SELECT;
}>;

export type WikiArticleListResult = {
  data: WikiArticleItem[];
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

    return { data: article };
  }

  async create(
    dto: CreateWikiArticleDto,
    authorUserId: string,
  ): Promise<{ data: WikiArticleItem }> {
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
          summary: dto.summary,
          body_markdown: dto.body_markdown,
          status: dto.status ?? "draft",
          published_at: dto.status === "published" ? new Date() : null,
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
          is_published: dto.status === "published",
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

    return { data: article };
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

    const article = await this.prisma.$transaction(async (tx) => {
      const latestRevision = await tx.wiki_revisions.findFirst({
        where: { article_id: id },
        select: { revision_number: true },
        orderBy: { revision_number: "desc" },
      });
      const nextRevisionNumber = (latestRevision?.revision_number ?? 0) + 1;
      const requestedStatus = dto.status ?? existing.status;
      const writeData: ArticleWriteData = {
        ...(dto.entity_table !== undefined && { entity_table: dto.entity_table }),
        ...(dto.entity_id !== undefined && { entity_id: dto.entity_id }),
        ...(language ? { language_id: language.id } : {}),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.body_markdown !== undefined && { body_markdown: dto.body_markdown }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(requestedStatus === "published" && !existing.published_at && {
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

    return { data: article };
  }

  async submitRevision(
    articleId: string,
    dto: SubmitWikiRevisionDto,
    authorUserId: string,
  ): Promise<{ data: WikiRevisionItem }> {
    const article = await this.findArticle(articleId);
    if (dto.title === undefined && dto.body_markdown === undefined) {
      throw new BadRequestException("A title or body_markdown change is required");
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

  async listRevisions(articleId: string): Promise<{ data: WikiRevisionItem[] }> {
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

    return { data: article };
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
    const where: Prisma.wiki_articlesWhereInput = {
      deleted_at: null,
      ...(publishedOnly ? { status: "published" } : query.status ? { status: query.status } : {}),
      ...(query.entity_table && { entity_table: query.entity_table }),
      ...(query.entity_id && { entity_id: query.entity_id }),
      ...(language && { language_id: language.id }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          { body_markdown: { contains: q, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.wiki_articles.findMany({
        where,
        select: WIKI_ARTICLE_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: publishedOnly
          ? [{ published_at: "desc" }, { updated_at: "desc" }]
          : [{ updated_at: "desc" }],
      }),
      this.prisma.wiki_articles.count({ where }),
    ]);

    return { data: items, meta: createPaginationMeta(total, page, pageSize) };
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
    const distinctIds = [...new Set(citations.map((citation) => citation.citation_id))];
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
}
