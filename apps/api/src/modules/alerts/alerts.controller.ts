import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AlertsService } from "./alerts.service";

@ApiTags("alerts")
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get("status")
  @ApiOperation({ summary: "Alerts module scaffold status" })
  getStatus() {
    return this.alertsService.getStatus();
  }
}
