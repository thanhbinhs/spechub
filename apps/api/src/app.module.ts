import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { CommonModule } from "./common/common.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { HealthController } from "./health/health.controller";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { DeviceCategoriesModule } from "./modules/device-categories/device-categories.module";
import { ProductFamiliesModule } from "./modules/product-families/product-families.module";
import { DeviceModelsModule } from "./modules/device-models/device-models.module";
import { DeviceVariantsModule } from "./modules/device-variants/device-variants.module";
import { ChipsetsModule } from "./modules/chipsets/chipsets.module";
import { DisplayUnitsModule } from "./modules/display-units/display-units.module";
import { BatteryUnitsModule } from "./modules/battery-units/battery-units.module";
import { CameraModulesModule } from "./modules/camera-modules/camera-modules.module";
import { HardwareCatalogModule } from "./modules/hardware-catalog/hardware-catalog.module";
import { SearchModule } from "./modules/search/search.module";
import { AiModule } from "./modules/ai/ai.module";
import { DataIngestionModule } from "./modules/data-ingestion/data-ingestion.module";
import { CitationsModule } from "./modules/citations/citations.module";
import { WishlistsModule } from "./modules/wishlists/wishlists.module";
import { AffiliateModule } from "./modules/affiliate/affiliate.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { WikiModule } from "./modules/wiki/wiki.module";
import { ApiKeysModule } from "./modules/api-keys/api-keys.module";
import { B2bModule } from "./modules/b2b/b2b.module";
import { AdminDashboardModule } from "./modules/admin-dashboard/admin-dashboard.module";
import { CatalogStudioModule } from "./modules/catalog-studio/catalog-studio.module";

import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env", "../../.env.local", "../../.env"],
      cache: true,
    }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 10 },
      { name: "long", ttl: 60_000, limit: 100 },
    ]),
    ScheduleModule.forRoot(),

    // Core modules
    CommonModule,
    PrismaModule,
    RedisModule,

    // Feature modules
    UsersModule,
    AuthModule,
    OrganizationsModule,
    DeviceCategoriesModule,
    ProductFamiliesModule,
    DeviceModelsModule,
    DeviceVariantsModule,
    ChipsetsModule,
    DisplayUnitsModule,
    BatteryUnitsModule,
    CameraModulesModule,
    HardwareCatalogModule,
    SearchModule,
    AiModule,
    DataIngestionModule,
    CitationsModule,
    WishlistsModule,
    AffiliateModule,
    AlertsModule,
    NotificationsModule,
    SubscriptionsModule,
    WikiModule,
    ApiKeysModule,
    B2bModule,
    AdminDashboardModule,
    CatalogStudioModule,
  ],
  controllers: [HealthController],
  providers: [
    // Throttler guard chạy đầu tiên
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // JWT guard chạy thứ 2 - protect mọi endpoint mặc định
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Roles guard chạy thứ 3 - check role nếu có @Roles()
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
