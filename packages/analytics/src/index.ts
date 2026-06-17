export type AnalyticsEventName =
  | "auth.signed_in"
  | "auth.signed_out"
  | "device.viewed"
  | "device.compared"
  | "search.performed"
  | "ai.question_asked"
  | (string & {});

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  properties?: Record<string, unknown>;
  timestamp?: string;
};

export type AnalyticsClient = {
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
  track(event: AnalyticsEvent): void;
};

export function createNoopAnalyticsClient(): AnalyticsClient {
  return {
    identify: () => undefined,
    reset: () => undefined,
    track: () => undefined,
  };
}
