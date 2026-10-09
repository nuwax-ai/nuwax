import type {
  OpenUiAction,
  OpenUiActionArtifact,
} from '@/types/interfaces/openUi';

type Sender = (
  artifact: OpenUiActionArtifact,
  action: OpenUiAction,
) => void | Promise<void>;
const senders = new Map<string, Sender>();

export function registerOpenUiActionSender(
  conversationId: number | string,
  sender: Sender,
): () => void {
  const key = String(conversationId);
  senders.set(key, sender);
  return () => {
    if (senders.get(key) === sender) senders.delete(key);
  };
}

export function getOpenUiActionSender(
  conversationId?: number | string,
): Sender | undefined {
  return conversationId === undefined
    ? undefined
    : senders.get(String(conversationId));
}
