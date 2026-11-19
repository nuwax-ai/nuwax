import type { MessageInfo } from '@/types/interfaces/conversationInfo';
type McpAskInteraction = NonNullable<MessageInfo['mcpAskInteractions']>[number];

export const mcpAskResolutionKey = (interaction: McpAskInteraction) =>
  JSON.stringify([interaction.input.requestId, interaction.input.revision]);

export function getLatestMcpAskRevisions(messages: MessageInfo[]) {
  const revisions = new Map<string, number>();
  for (const message of messages) {
    for (const { input } of message.mcpAskInteractions ?? []) {
      if (!Number.isInteger(input.revision)) continue;
      const previous = revisions.get(input.requestId);
      if (previous === undefined || input.revision > previous) {
        revisions.set(input.requestId, input.revision);
      }
    }
  }
  return revisions;
}

/** 同一会话的旧 pending 快照不能复活已应答的问题；新 revision 不受影响。 */
export function preserveResolvedMcpAskInteractions(
  current: MessageInfo[],
  incoming: MessageInfo[],
) {
  const resolved = new Map<string, McpAskInteraction>();
  current.forEach((message) =>
    message.mcpAskInteractions?.forEach((interaction) => {
      if (
        ['submitted', 'cancelled', 'skipped'].includes(
          interaction.responseStatus || '',
        )
      ) {
        resolved.set(mcpAskResolutionKey(interaction), interaction);
      }
    }),
  );
  if (!resolved.size) return incoming;
  return incoming.map((message) => {
    let changed = false;
    const interactions = message.mcpAskInteractions?.map((interaction) => {
      const local = resolved.get(mcpAskResolutionKey(interaction));
      if (
        !local ||
        ['submitted', 'cancelled', 'skipped'].includes(
          interaction.responseStatus || '',
        )
      )
        return interaction;
      changed = true;
      return {
        ...interaction,
        responseStatus: local.responseStatus,
        formData: local.formData,
      };
    });
    return changed ? { ...message, mcpAskInteractions: interactions } : message;
  });
}
