export const RAW_PAGE_STATUSES = [
  "pending",
  "fetched",
  "parsed",
  "needs_review",
  "approved",
  "rejected",
  "failed",
] as const;

export type RawPageStatus = (typeof RAW_PAGE_STATUSES)[number];
