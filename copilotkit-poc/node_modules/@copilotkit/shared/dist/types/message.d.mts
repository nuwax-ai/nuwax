import * as agui from "@ag-ui/core";
import { AudioInputPart, DocumentInputPart, ImageInputPart, InputContent, InputContentDataSource as InputContentDataSource$1, InputContentSource, InputContentUrlSource as InputContentUrlSource$1, TextInputContent as TextInputPart, VideoInputPart } from "@ag-ui/core";

//#region src/types/message.d.ts
/**
 * @deprecated Use `InputContentSource` from `@ag-ui/core` (re-exported from `@copilotkit/shared`) instead.
 * `ImageData` only described base64 image payloads. `InputContentSource` supports
 * data and URL sources for images, audio, video, and documents.
 * See https://docs.copilotkit.ai/migration-guides/migrate-attachments
 * @since 1.56.0
 */
interface ImageData {
  format: string;
  bytes: string;
}
type Role = agui.Role;
type SystemMessage = agui.SystemMessage;
type DeveloperMessage = agui.DeveloperMessage;
type ToolCall = agui.ToolCall;
type ActivityMessage = agui.ActivityMessage;
type ReasoningMessage = agui.ReasoningMessage;
type ToolResult = agui.ToolMessage & {
  toolName?: string;
};
type AIMessage = agui.AssistantMessage & {
  generativeUI?: (props?: any) => any;
  generativeUIPosition?: "before" | "after";
  agentName?: string;
  state?: any;
  /**
   * @deprecated Use multimodal `content` array with `InputContent` parts instead.
   * See https://docs.copilotkit.ai/migration-guides/migrate-attachments
   * @since 1.56.0
   */
  image?: ImageData;
  runId?: string;
};
type UserMessage = agui.UserMessage;
type Message = AIMessage | ToolResult | UserMessage | SystemMessage | DeveloperMessage | ActivityMessage | ReasoningMessage;
//#endregion
export { AIMessage, ActivityMessage, type AudioInputPart, DeveloperMessage, type DocumentInputPart, ImageData, type ImageInputPart, type InputContent, type InputContentDataSource$1 as InputContentDataSource, type InputContentSource, type InputContentUrlSource$1 as InputContentUrlSource, Message, ReasoningMessage, Role, SystemMessage, type TextInputPart, ToolCall, ToolResult, UserMessage, type VideoInputPart };
//# sourceMappingURL=message.d.mts.map