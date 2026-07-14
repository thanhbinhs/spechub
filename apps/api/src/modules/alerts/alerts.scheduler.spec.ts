import { ConfigService } from "@nestjs/config";
import { AlertsService } from "./alerts.service";
import { PriceAlertsScheduler } from "./alerts.scheduler";

describe("PriceAlertsScheduler", () => {
  const alertsService = {
    checkActiveAlerts: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };

  let scheduler: PriceAlertsScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new PriceAlertsScheduler(
      alertsService as unknown as AlertsService,
      configService as unknown as ConfigService,
    );
  });

  it("does not run when scheduled price checks are disabled", async () => {
    configService.get.mockReturnValue("false");

    await scheduler.handleHourlyPriceAlertCheck();

    expect(alertsService.checkActiveAlerts).not.toHaveBeenCalled();
  });

  it("runs active alert checks when scheduled price checks are enabled", async () => {
    configService.get.mockReturnValue("true");
    alertsService.checkActiveAlerts.mockResolvedValue({
      data: { checked: 1, triggered: 1 },
    });

    await scheduler.handleHourlyPriceAlertCheck();

    expect(alertsService.checkActiveAlerts).toHaveBeenCalledTimes(1);
  });
});
