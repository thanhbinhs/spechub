import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("status")
  @ApiOperation({ summary: "Notifications module scaffold status" })
  getStatus() {
    return this.notificationsService.getStatus();
  }
}
