import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { QueryNotificationsDto } from "./dto/query-notifications.dto";

const NOTIFICATION_SELECT = {
  id: true,
  user_id: true,
  type: true,
  title: true,
  body: true,
  data: true,
  read_at: true,
  created_at: true,
} satisfies Prisma.notificationsSelect;

export type NotificationItem = Prisma.notificationsGetPayload<{
  select: typeof NOTIFICATION_SELECT;
}>;

export type NotificationListResult = {
  data: NotificationItem[];
  meta: PaginationMeta;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<NotificationListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.notificationsWhereInput = {
      user_id: userId,
      ...(query.unread_only && { read_at: null }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notifications.findMany({
        where,
        select: NOTIFICATION_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ created_at: "desc" }],
      }),
      this.prisma.notifications.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notifications.count({
      where: { user_id: userId, read_at: null },
    });

    return { data: { count } };
  }

  async create(dto: CreateNotificationDto): Promise<NotificationItem> {
    return this.createInternal(dto);
  }

  async createInternal(dto: CreateNotificationDto): Promise<NotificationItem> {
    const user = await this.prisma.users.findUnique({
      where: { id: dto.user_id },
      select: { email: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${dto.user_id} not found`);
    }

    return this.prisma.notifications.create({
      data: {
        user_id: dto.user_id,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data as Prisma.InputJsonValue | undefined,
        deliveries: {
          create: {
            channel: "email",
            recipient: user.email,
          },
        },
      },
      select: NOTIFICATION_SELECT,
    });
  }

  async markRead(userId: string, id: string): Promise<NotificationItem> {
    const notification = await this.prisma.notifications.findUnique({
      where: { id },
      select: { id: true, user_id: true },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.user_id !== userId) {
      throw new ForbiddenException("You do not own this notification");
    }

    return this.prisma.notifications.update({
      where: { id },
      data: { read_at: new Date() },
      select: NOTIFICATION_SELECT,
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notifications.updateMany({
      where: { user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });

    return { data: { updated: result.count } };
  }
}
