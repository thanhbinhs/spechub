import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AlertsService } from "./alerts.service";

@Injectable()
export class PriceAlertsScheduler {
  private readonly logger = new Logger(PriceAlertsScheduler.name);
  private isRunning = false;

  constructor(
    private readonly alertsService: AlertsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    name: "price-alerts-hourly-check",
  })
  async handleHourlyPriceAlertCheck() {
    if (!this.isEnabled()) {
      return;
    }

    if (this.isRunning) {
      this.logger.warn("Skipping price alert check because a run is active");
      return;
    }

    this.isRunning = true;

    try {
      const result = await this.alertsService.checkActiveAlerts();
      const { checked, triggered } = result.data;

      if (checked > 0 || triggered > 0) {
        this.logger.log(
          `Checked ${checked} active price alerts; triggered ${triggered}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Scheduled price alert check failed: ${String(error)}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  private isEnabled() {
    const value = this.configService.get<string>(
      "PRICE_ALERTS_SCHEDULE_ENABLED",
      "false",
    );

    return value === "true" || value === "1";
  }
}
