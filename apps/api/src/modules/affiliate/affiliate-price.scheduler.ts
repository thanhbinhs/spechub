import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { AlertsService } from "../alerts/alerts.service";
import { AffiliateService } from "./affiliate.service";

@Injectable()
export class AffiliatePriceScheduler {
  private readonly logger = new Logger(AffiliatePriceScheduler.name);
  private isRunning = false;

  constructor(
    private readonly affiliateService: AffiliateService,
    private readonly alertsService: AlertsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron("*/30 * * * *", { name: "affiliate-price-background-sync" })
  async handlePriceSync() {
    if (!this.isEnabled()) return;
    if (this.isRunning) {
      this.logger.warn("Skipping affiliate price sync because a run is active");
      return;
    }

    this.isRunning = true;
    try {
      const result = await this.affiliateService.syncDueLinks({
        maxAgeMinutes: this.numberSetting(
          "AFFILIATE_PRICE_SYNC_MAX_AGE_MINUTES",
          180,
        ),
        limit: this.numberSetting("AFFILIATE_PRICE_SYNC_BATCH_SIZE", 24),
        concurrency: this.numberSetting("AFFILIATE_PRICE_SYNC_CONCURRENCY", 4),
      });
      const { checked, updated, failed } = result.data;
      if (checked > 0) {
        const alerts = await this.alertsService.checkActiveAlerts();
        this.logger.log(
          `Synced ${updated}/${checked} affiliate prices; failed=${failed}; alerts=${alerts.data.triggered}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Scheduled affiliate price sync failed: ${String(error)}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  private isEnabled() {
    const value = this.configService.get<string>(
      "AFFILIATE_PRICE_SYNC_ENABLED",
      "true",
    );
    return value === "true" || value === "1";
  }

  private numberSetting(key: string, fallback: number) {
    const value = Number(this.configService.get<string>(key, String(fallback)));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
  }
}
