import { SetMetadata } from "@nestjs/common";

export const RAW_RESPONSE_KEY = "raw-response";

/** Skip the global JSON envelope for protocol-specific response bodies. */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
