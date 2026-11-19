import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  readTaskRecord,
  visitTaskRecords,
  writeTaskRecord,
} from '@/utils/conversationTaskStorage';
import { getLatestMcpAskRevisions } from '@/utils/mcpAskResolution';
import type {
  InteractionUiSchema,
  McpAskInteraction,
} from '../types/mcpAskIntervention';
import { hydrateMcpAskInteractionsInMessageList } from './mcpAskHydrateMessage';

type DraftValue = null | string | number | boolean | (string | number)[];

interface McpAskDraft {
  fields: Record<string, DraftValue>;
  stepId?: string;
}

const draftPrefix = (scope: string) => `${scope}ask:`;

function requestPrefix(scope: string, requestId: string) {
  return `${draftPrefix(scope)}${encodeURIComponent(requestId)}:`;
}

export function mcpAskDraftKey(scope: string, interaction: McpAskInteraction) {
  const { requestId, revision } = interaction.input;
  if (!requestId || !Number.isInteger(revision)) return undefined;
  return `${requestPrefix(scope, requestId)}${revision}`;
}

function safeDraftFields(
  ui: InteractionUiSchema,
  fields: Record<string, unknown>,
) {
  if (ui.persistDraft === false) return {};
  const allowed = new Set<string>();
  const excluded = new Set<string>();
  for (const field of ui.fields ?? []) {
    // Ask 的文件上传是临时引用，现有接口无法在冷启动时重新取得有效引用。
    const names =
      field.persistDraft === false || field.widget === 'file'
        ? excluded
        : allowed;
    names.add(field.name);
    if (field.widget === 'radio-with-custom') {
      names.add(field.otherField ?? `${field.name}Custom`);
    }
  }
  return Object.fromEntries(
    Object.entries(fields).flatMap<[string, DraftValue]>(([name, value]) => {
      if (!allowed.has(name) || excluded.has(name)) return [];
      if (value === null || value === undefined) return [[name, null]];
      if (
        typeof value === 'string' ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value))
      )
        return [[name, value]];
      if (
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === 'string' ||
            (typeof item === 'number' && Number.isFinite(item)),
        )
      )
        return [[name, value]];
      return [];
    }),
  );
}

export function readMcpAskDraft(
  key: string,
  ui: InteractionUiSchema,
): McpAskDraft | undefined {
  const saved = readTaskRecord<McpAskDraft>(key);
  if (
    ui.persistDraft === false ||
    !saved?.fields ||
    typeof saved.fields !== 'object'
  )
    return undefined;
  return {
    fields: safeDraftFields(ui, saved.fields),
    stepId: typeof saved.stepId === 'string' ? saved.stepId : undefined,
  };
}

export function saveMcpAskDraft(
  key: string,
  ui: InteractionUiSchema,
  changes: Record<string, unknown>,
  stepId?: string,
) {
  if (ui.persistDraft === false) return;
  const previous = readMcpAskDraft(key, ui);
  const fields = { ...previous?.fields, ...safeDraftFields(ui, changes) };
  if (!Object.keys(fields).length && stepId === undefined) return;
  writeTaskRecord(key, { fields, stepId });
}

export function getResolvedMcpAskDraftKeys(
  scope: string,
  history?: MessageInfo[],
) {
  const resolved = new Set<string>();
  for (const message of hydrateMcpAskInteractionsInMessageList(history)) {
    for (const interaction of message.mcpAskInteractions ?? []) {
      const key = mcpAskDraftKey(scope, interaction);
      if (
        key &&
        interaction.responseStatus &&
        !['pending', 'submitting'].includes(interaction.responseStatus)
      ) {
        resolved.add(key);
      }
    }
  }
  return resolved;
}

export function reconcileMcpAskDrafts(
  scope: string,
  expired: boolean,
  messages: MessageInfo[],
  resolved = new Set<string>(),
) {
  const latestVersions = getLatestMcpAskRevisions(messages);
  const latestByPrefix = new Map(
    [...latestVersions].map(([id, revision]) => [
      requestPrefix(scope, id),
      revision,
    ]),
  );
  visitTaskRecords(draftPrefix(scope), (key) => {
    const separator = key.lastIndexOf(':');
    const revision = Number(key.slice(separator + 1));
    const latest = latestByPrefix.get(key.slice(0, separator + 1));
    const superseded = latest !== undefined && revision < latest;
    if (expired || resolved.has(key) || superseded)
      writeTaskRecord(key, undefined);
  });
}
