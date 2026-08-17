import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import { FastifyReply, FastifyRequest } from "fastify";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const uniqueConflictMessage = this.uniqueConflictMessage(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : uniqueConflictMessage
          ? HttpStatus.CONFLICT
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (uniqueConflictMessage ?? "Internal server error");

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        (exception as Error).stack,
      );
    }

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  private uniqueConflictMessage(exception: unknown): string | null {
    if (
      !(exception instanceof Prisma.PrismaClientKnownRequestError) ||
      exception.code !== "P2002"
    ) {
      return null;
    }

    const target = Array.isArray(exception.meta?.target)
      ? exception.meta.target.filter(
          (field): field is string => typeof field === "string",
        )
      : [];

    if (target.includes("name")) {
      return "Tên mô-đun này đã tồn tại. Hãy chỉnh sửa bản ghi hiện có hoặc dùng tên khác.";
    }
    if (target.includes("slug")) {
      return "Đường dẫn định danh này đã tồn tại. Hãy chỉnh sửa bản ghi hiện có hoặc dùng đường dẫn khác.";
    }
    return "Mô-đun này đã tồn tại. Hãy chỉnh sửa bản ghi hiện có hoặc kiểm tra lại tên và đường dẫn định danh.";
  }
}
