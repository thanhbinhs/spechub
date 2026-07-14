import { ForbiddenException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  const prisma = {
    notifications: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };

  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prisma as any);
  });

  it("lists only unread notifications when requested", async () => {
    prisma.notifications.findMany.mockResolvedValue([{ id: "notification-1" }]);
    prisma.notifications.count.mockResolvedValue(1);

    await expect(
      service.findMany("user-1", {
        page: 1,
        pageSize: 10,
        unread_only: true,
      } as any),
    ).resolves.toEqual({
      data: [{ id: "notification-1" }],
      meta: {
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });

    expect(prisma.notifications.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          user_id: "user-1",
          read_at: null,
        },
      }),
    );
  });

  it("blocks users from marking another user's notification as read", async () => {
    prisma.notifications.findUnique.mockResolvedValue({
      id: "notification-1",
      user_id: "owner-1",
    });

    await expect(
      service.markRead("user-2", "notification-1"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("marks all unread notifications for the current user", async () => {
    prisma.notifications.updateMany.mockResolvedValue({ count: 3 });

    await expect(service.markAllRead("user-1")).resolves.toEqual({
      data: { updated: 3 },
    });

    expect(prisma.notifications.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: "user-1", read_at: null },
        data: { read_at: expect.any(Date) },
      }),
    );
  });
});
