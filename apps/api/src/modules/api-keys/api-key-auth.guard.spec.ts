import { ApiKeyAuthGuard } from "./api-key-auth.guard";

describe("ApiKeyAuthGuard", () => {
  it("adds rate and quota headers after authorizing a B2B key", async () => {
    const authorize = jest.fn().mockResolvedValue({
      id: "key-1",
      user_id: "user-1",
      scopes: ["catalog:read"],
      rate_limit_per_minute: 60,
      monthly_quota: 1_000,
      rate_limit_remaining: 59,
      rate_limit_reset_at: new Date(Date.now() + 45_000),
      monthly_quota_remaining: 999,
    });
    const request = { headers: { "x-api-key": "sph_b2b_test" } };
    const reply = { header: jest.fn().mockReturnThis() };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => reply,
      }),
    };
    const guard = new ApiKeyAuthGuard({ authorize } as any);

    await expect(guard.canActivate(context as any)).resolves.toBe(true);

    expect(request).toMatchObject({ apiKey: expect.objectContaining({ id: "key-1" }) });
    expect(reply.header).toHaveBeenCalledWith("RateLimit-Limit", "60");
    expect(reply.header).toHaveBeenCalledWith("RateLimit-Remaining", "59");
    expect(reply.header).toHaveBeenCalledWith("RateLimit-Reset", expect.any(String));
    expect(reply.header).toHaveBeenCalledWith("X-Monthly-Quota-Remaining", "999");
  });
});
