import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AdminDashboardService } from "./admin-dashboard.service";

@ApiTags("admin-dashboard")
@ApiBearerAuth()
@Controller("admin/dashboard")
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get("overview")
  @Roles(USER_ROLES.ADMIN, USER_ROLES.EDITOR)
  @ApiOperation({
    summary: "Admin: số liệu tổng hợp cho dashboard vận hành",
  })
  overview(@CurrentUser("role") role: string) {
    return this.dashboardService.getOverview(role === USER_ROLES.ADMIN);
  }
}
