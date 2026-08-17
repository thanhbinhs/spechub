import { AffiliatePriceScheduler } from "./affiliate-price.scheduler";

describe("AffiliatePriceScheduler", () => {
  const affiliateService = { syncDueLinks: jest.fn() };
  const alertsService = { checkActiveAlerts: jest.fn() };
  const configService = { get: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation(
      (_key: string, fallback: string) => fallback,
    );
    affiliateService.syncDueLinks.mockResolvedValue({
      data: { checked: 3, updated: 3, failed: 0 },
    });
    alertsService.checkActiveAlerts.mockResolvedValue({
      data: { checked: 2, triggered: 1 },
    });
  });

  it("refreshes due prices and checks alerts without admin action", async () => {
    const scheduler = new AffiliatePriceScheduler(
      affiliateService as any,
      alertsService as any,
      configService as any,
    );

    await scheduler.handlePriceSync();

    expect(affiliateService.syncDueLinks).toHaveBeenCalledWith({
      maxAgeMinutes: 180,
      limit: 24,
      concurrency: 4,
    });
    expect(alertsService.checkActiveAlerts).toHaveBeenCalledTimes(1);
  });

  it("does nothing when automatic sync is disabled", async () => {
    configService.get.mockReturnValue("false");
    const scheduler = new AffiliatePriceScheduler(
      affiliateService as any,
      alertsService as any,
      configService as any,
    );

    await scheduler.handlePriceSync();

    expect(affiliateService.syncDueLinks).not.toHaveBeenCalled();
    expect(alertsService.checkActiveAlerts).not.toHaveBeenCalled();
  });
});
