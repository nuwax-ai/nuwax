import { InputContentSource } from "../types/message.mjs";
import { AttachmentModality } from "./types.mjs";

//#region src/attachments/utils.d.ts
/**
 * Derive the attachment modality from a MIME type string.
 */
declare function getModalityFromMimeType(mimeType: string): AttachmentModality;
/**
 * Format a byte count as a human-readable file size string.
 */
declare function formatFileSize(bytes: number): string;
/**
 * Check if a file exceeds the maximum allowed size.
 */
declare function exceedsMaxSize(file: File, maxSize?: number): boolean;
/**
 * Read a File as a base64 string (without the data URL prefix).
 */
declare function readFileAsBase64(file: File): Promise<string>;
/**
 * Generate a thumbnail data URL from a video file by capturing a frame near the start (at 0.1s).
 * Returns undefined if thumbnail generation fails or if called outside a browser environment.
 */
declare function generateVideoThumbnail(file: File): Promise<string | undefined>;
/**
 * Check if a file's MIME type matches an accept filter string.
 * Handles file extensions (e.g. ".pdf"), MIME wildcards ("image/*"), and comma-separated lists.
 */
declare function matchesAcceptFilter(file: File, accept: string): boolean;
/**
 * Convert an InputContentSource to a usable URL string.
 * For data sources, returns a base64 data URL; for URL sources, returns the URL directly.
 */
declare function getSourceUrl(source: InputContentSource): string;
/**
 * Return a short human-readable label for a document MIME type (e.g. "PDF", "DOC").
 */
declare function getDocumentIcon(mimeType: string): string;
//#endregion
export { exceedsMaxSize, formatFileSize, generateVideoThumbnail, getDocumentIcon, getModalityFromMimeType, getSourceUrl, matchesAcceptFilter, readFileAsBase64 };
//# sourceMappingURL=utils.d.mts.map