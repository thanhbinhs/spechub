import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { USER_ROLES } from "../../common/constants";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { AssignSubscriptionDto } from "./dto/assign-subscription.dto";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { QueryBillingAuditDto } from "./dto/query-billing-audit.dto";
import { UpdateSubscriptionPlanDto } from "./dto/update-subscription-plan.dto";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get("plans")
  @ApiOperation({ summary: "List active subscription plans" })
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my current subscription and features" })
  getMe(@CurrentUser("id") userId: string) {
    return this.subscriptionsService.getMe(userId);
  }

  @Get("me/audit")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my billing audit history" })
  listMyAudit(
    @CurrentUser("id") userId: string,
    @Query() query: QueryBillingAuditDto,
  ) {
    return this.subscriptionsService.listMyAudit(userId, query);
  }

  @Post("checkout")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create Stripe Checkout session for a plan" })
  createCheckout(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.subscriptionsService.createCheckout(userId, dto);
  }

  @Post("me/cancel")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel my subscription at period end" })
  cancelMySubscription(@CurrentUser("id") userId: string) {
    return this.subscriptionsService.cancelMySubscription(userId);
  }

  @Post("me/resume")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Resume a subscription scheduled for cancellation" })
  resumeMySubscription(@CurrentUser("id") userId: string) {
    return this.subscriptionsService.resumeMySubscription(userId);
  }

  @Post("me/retry-payment")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retry an open Stripe invoice for my subscription" })
  retryMyPayment(@CurrentUser("id") userId: string) {
    return this.subscriptionsService.retryMyPayment(userId);
  }

  @Get("admin/plans")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: list all subscription plans" })
  listPlansForAdmin() {
    return this.subscriptionsService.listPlansForAdmin();
  }

  @Post("admin/plans")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: create a subscription plan" })
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch("admin/plans/:id")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: update a subscription plan" })
  updatePlan(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Get("admin/audit")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: list billing audit records" })
  listAudit(@Query() query: QueryBillingAuditDto) {
    return this.subscriptionsService.listAudit(query);
  }

  @Patch("users/:userId")
  @ApiBearerAuth()
  @Roles(USER_ROLES.ADMIN)
  @ApiOperation({ summary: "Admin: assign subscription to user" })
  assignUserSubscription(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: AssignSubscriptionDto,
  ) {
    return this.subscriptionsService.assignUserSubscription(userId, dto);
  }
}
