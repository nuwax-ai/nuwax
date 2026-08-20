import { type LangSmithMessage } from "./messages.js";
import type { SDKAssistantMessage } from "./types.js";
export type TranscriptAssistantTurn = {
    messageId: string;
    model?: string;
    content: Record<string, unknown>[];
    usage?: Record<string, unknown>;
    usageMetadata?: Record<string, unknown>;
    timestamp?: number;
    inputMessages: LangSmithMessage[];
    message: SDKAssistantMessage;
};
export type TranscriptToolResult = {
    toolUseId: string;
    content: unknown;
    isError?: boolean;
};
export type TranscriptData = {
    turns: TranscriptAssistantTurn[];
    usageByMessageId: Record<string, Record<string, unknown>>;
    toolResults: TranscriptToolResult[];
};
