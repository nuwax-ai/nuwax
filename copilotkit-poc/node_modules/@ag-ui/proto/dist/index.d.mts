import { BaseEvent } from "@ag-ui/core";

//#region src/proto.d.ts
/**
 * Encodes an event message to a protocol buffer binary format.
 */
declare function encode(event: BaseEvent): Uint8Array;
/**
 * Decodes a protocol buffer binary format to an event message.
 * The format includes a 4-byte length prefix followed by the message.
 */
declare function decode(data: Uint8Array): BaseEvent;
//#endregion
//#region src/index.d.ts
declare const AGUI_MEDIA_TYPE = "application/vnd.ag-ui.event+proto";
//#endregion
export { AGUI_MEDIA_TYPE, decode, encode };
//# sourceMappingURL=index.d.mts.map