import { EventEmitter } from "node:events";
import { AiController } from "./ai.controller";

type StreamRaw = EventEmitter & {
  writableEnded: boolean;
  statusCode: number;
  setHeader: jest.Mock;
  flushHeaders: jest.Mock;
  write: jest.Mock;
  end: jest.Mock;
};

function createStreamTransport() {
  const requestRaw = new EventEmitter();
  const responseRaw = new EventEmitter() as StreamRaw;
  responseRaw.writableEnded = false;
  responseRaw.statusCode = 0;
  responseRaw.setHeader = jest.fn();
  responseRaw.flushHeaders = jest.fn();
  responseRaw.write = jest.fn(() => true);
  responseRaw.end = jest.fn(() => {
    responseRaw.writableEnded = true;
  });

  return {
    request: { raw: requestRaw } as any,
    reply: {
      raw: responseRaw,
      getHeaders: jest.fn(() => ({ "x-request-id": "test-request" })),
      hijack: jest.fn(),
    } as any,
    responseRaw,
  };
}

describe("AiController stream transport", () => {
  it("writes NDJSON events immediately and preserves streaming headers", async () => {
    const aiService = {
      streamAsk: jest.fn(async (_dto, emit, signal: AbortSignal) => {
        expect(signal.aborted).toBe(false);
        await emit({
          type: "status",
          stage: "generating",
          message: "Trợ lý đang trả lời...",
        });
        await emit({ type: "delta", text: "Xin chào" });
        await emit({ type: "result", response: { data: {}, meta: {} } });
      }),
    };
    const controller = new AiController(aiService as any, {} as any, {} as any);
    const { request, reply, responseRaw } = createStreamTransport();

    await controller.askStream({ question: "xin chào" } as any, request, reply);

    expect(reply.hijack).toHaveBeenCalledTimes(1);
    expect(responseRaw.statusCode).toBe(200);
    expect(responseRaw.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/x-ndjson; charset=utf-8",
    );
    expect(responseRaw.setHeader).toHaveBeenCalledWith(
      "X-Accel-Buffering",
      "no",
    );
    expect(responseRaw.flushHeaders).toHaveBeenCalledTimes(1);
    expect(responseRaw.write.mock.calls.map(([line]) => JSON.parse(line))).toEqual([
      {
        type: "status",
        stage: "generating",
        message: "Trợ lý đang trả lời...",
      },
      { type: "delta", text: "Xin chào" },
      { type: "result", response: { data: {}, meta: {} } },
    ]);
    expect(responseRaw.end).toHaveBeenCalledTimes(1);
  });

  it("serializes an unexpected service failure as an NDJSON error event", async () => {
    const aiService = {
      streamAsk: jest.fn().mockRejectedValue(new Error("provider unavailable")),
    };
    const controller = new AiController(aiService as any, {} as any, {} as any);
    const { request, reply, responseRaw } = createStreamTransport();

    await controller.askStream({ question: "xin chào" } as any, request, reply);

    expect(responseRaw.write).toHaveBeenCalledWith(
      `${JSON.stringify({ type: "error", message: "provider unavailable" })}\n`,
    );
    expect(responseRaw.end).toHaveBeenCalledTimes(1);
  });

  it("does not write an error event after the client aborts the stream", async () => {
    const { request, reply, responseRaw } = createStreamTransport();
    const aiService = {
      streamAsk: jest.fn(async (_dto, _emit, signal: AbortSignal) => {
        request.raw.emit("aborted");
        expect(signal.aborted).toBe(true);
        expect(signal.reason).toEqual(new Error("client disconnected"));
        throw new Error("client disconnected");
      }),
    };
    const controller = new AiController(aiService as any, {} as any, {} as any);

    await controller.askStream({ question: "xin chào" } as any, request, reply);

    expect(responseRaw.write).not.toHaveBeenCalled();
    expect(responseRaw.end).toHaveBeenCalledTimes(1);
  });
});
