import { BaseEvent } from "@ag-ui/core";
import { AGUI_MEDIA_TYPE } from "@ag-ui/proto";

//#region src/encoder.d.ts
interface EventEncoderParams {
  accept?: string;
}
declare class EventEncoder {
  private acceptsProtobuf;
  constructor(params?: EventEncoderParams);
  getContentType(): string;
  encode(event: BaseEvent): string;
  encodeSSE(event: BaseEvent): string;
  encodeBinary(event: BaseEvent): Uint8Array;
  encodeProtobuf(event: BaseEvent): Uint8Array;
  private isProtobufAccepted;
}
//#endregion
export { AGUI_MEDIA_TYPE, EventEncoder, EventEncoderParams };
//# sourceMappingURL=index.d.ts.map