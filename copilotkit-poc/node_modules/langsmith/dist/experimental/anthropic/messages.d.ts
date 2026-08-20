import type { BetaContentBlock } from "./types.js";
export type LangSmithMessage = {
    content?: unknown;
    role?: string;
    id?: string;
} & Record<string, unknown>;
export declare function mergeMessagesById(previousMessages: LangSmithMessage[], newMessages: LangSmithMessage[]): LangSmithMessage[];
/**
 * Converts SDK content blocks into serializable objects.
 * Matches Python's flatten_content_blocks behavior.
 */
export declare function flattenContentBlocks(content: BetaContentBlock[] | unknown): Array<Record<string, unknown>> | unknown;
