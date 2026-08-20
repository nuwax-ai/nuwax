import { InputContentDataSource, InputContentUrlSource } from "@ag-ui/core";

//#region src/attachments/types.d.ts
interface AttachmentUploadDataResult {
  type: "data";
  value: string;
  mimeType: string;
  /** Custom metadata to include in the InputContent part (merged with auto-generated metadata like filename). */
  metadata?: Record<string, unknown>;
}
interface AttachmentUploadUrlResult {
  type: "url";
  value: string;
  mimeType?: string;
  /** Custom metadata to include in the InputContent part (merged with auto-generated metadata like filename). */
  metadata?: Record<string, unknown>;
}
type AttachmentUploadResult = AttachmentUploadDataResult | AttachmentUploadUrlResult;
type AttachmentUploadErrorReason = "file-too-large" | "invalid-type" | "upload-failed";
interface AttachmentUploadError {
  /** Why the upload failed. */
  reason: AttachmentUploadErrorReason;
  /** The file that failed to upload. */
  file: File;
  /** Human-readable error message. */
  message: string;
}
interface AttachmentsConfig {
  /** Enable file attachments in the chat input */
  enabled: boolean;
  /** MIME type filter for the file input, default all files */
  accept?: string;
  /** Maximum file size in bytes, default 20MB (20 * 1024 * 1024) */
  maxSize?: number;
  /** Custom upload handler. Return an InputContentSource with optional metadata. */
  onUpload?: (file: File) => AttachmentUploadResult | Promise<AttachmentUploadResult>;
  /** Called when an attachment fails validation or upload. Use this to show a toast or inline error. */
  onUploadFailed?: (error: AttachmentUploadError) => void;
}
type AttachmentModality = "image" | "audio" | "video" | "document";
interface Attachment {
  id: string;
  type: AttachmentModality;
  source: InputContentDataSource | InputContentUrlSource;
  filename?: string;
  size?: number;
  status: "uploading" | "ready";
  thumbnail?: string;
  /** Custom metadata from onUpload, included in the InputContent part. */
  metadata?: Record<string, unknown>;
}
//#endregion
export { Attachment, AttachmentModality, AttachmentUploadError, AttachmentUploadErrorReason, AttachmentUploadResult, AttachmentsConfig };
//# sourceMappingURL=types.d.cts.map