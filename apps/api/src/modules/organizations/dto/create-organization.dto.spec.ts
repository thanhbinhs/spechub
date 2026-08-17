import { validate } from "class-validator";
import { CreateOrganizationDto } from "./create-organization.dto";

function organizationWithLogo(logoUrl: string) {
  return Object.assign(new CreateOrganizationDto(), {
    name: "SpecHub Local Test",
    slug: "spechub-local-test",
    description:
      "Tổ chức kiểm thử có mô tả đầy đủ để xác nhận quy tắc kiểm tra dữ liệu hoạt động chính xác.",
    logo_url: logoUrl,
  });
}

describe("CreateOrganizationDto", () => {
  it("accepts a signed local-storage public URL in development", async () => {
    const errors = await validate(
      organizationWithLogo(
        "http://localhost:4000/media/organizations/2026/07/logo.webp",
      ),
    );

    expect(errors).toHaveLength(0);
  });

  it("rejects a malformed logo URL", async () => {
    const errors = await validate(organizationWithLogo("not-a-url"));

    expect(
      errors.some(
        (error) =>
          error.property === "logo_url" &&
          Boolean(error.constraints?.isUrl),
      ),
    ).toBe(true);
  });
});
