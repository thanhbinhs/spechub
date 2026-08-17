import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import { GlobalExceptionFilter } from "./global-exception.filter";

describe("GlobalExceptionFilter", () => {
  it("returns a clear conflict when a module name already exists", () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const request = {
      method: "POST",
      url: "/api/v1/admin/hardware/modules",
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
    const error = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "6.1.0",
        meta: { target: ["name"] },
      },
    );

    new GlobalExceptionFilter().catch(error, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        path: request.url,
        message:
          "Tên mô-đun này đã tồn tại. Hãy chỉnh sửa bản ghi hiện có hoặc dùng tên khác.",
      }),
    );
  });
});
