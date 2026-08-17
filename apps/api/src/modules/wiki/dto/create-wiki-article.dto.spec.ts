import { validate } from "class-validator";
import { CreateWikiArticleDto } from "./create-wiki-article.dto";

function createValidDto(
  overrides: Partial<CreateWikiArticleDto> = {},
): CreateWikiArticleDto {
  return Object.assign(new CreateWikiArticleDto(), {
    entity_table: "community_articles",
    entity_id: "article-1",
    title: "So sánh camera điện thoại cao cấp",
    slug: "so-sanh-camera-dien-thoai-cao-cap",
    ...overrides,
  });
}

describe("CreateWikiArticleDto cover image metadata", () => {
  it("accepts a valid cover image and its accessible metadata", async () => {
    const errors = await validate(
      createValidDto({
        cover_image_url: "https://images.example.com/camera-comparison.webp",
        cover_image_alt: "Hai cụm camera điện thoại đặt cạnh nhau",
        cover_image_caption: "So sánh bố cục camera của hai thiết bị.",
        cover_image_credit: "Ảnh: SpecHub",
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it("accepts null metadata so an editor can clear existing values", async () => {
    const errors = await validate(
      createValidDto({
        cover_image_url: null,
        cover_image_alt: null,
        cover_image_caption: null,
        cover_image_credit: null,
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it("accepts a site-relative image from the SpecHub media library", async () => {
    const errors = await validate(
      createValidDto({
        cover_image_url: "/images/devices/iphone-16.webp",
        cover_image_alt: "iPhone 16 màu xanh",
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it("rejects invalid URLs and oversized cover image metadata", async () => {
    const errors = await validate(
      createValidDto({
        cover_image_url: "javascript:alert(1)",
        cover_image_alt: "a".repeat(301),
        cover_image_caption: "c".repeat(501),
        cover_image_credit: "x".repeat(201),
      }),
    );
    const invalidProperties = errors.map((error) => error.property);

    expect(invalidProperties).toEqual(
      expect.arrayContaining([
        "cover_image_url",
        "cover_image_alt",
        "cover_image_caption",
        "cover_image_credit",
      ]),
    );
  });
});
