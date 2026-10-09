import {
  getToolPresentationKind,
  type ToolPresentationKind,
} from '@/components/MarkdownCustomProcess/toolPresentation';
import type { AgentComponentTypeEnum } from '@/types/enums/agent';
import { normalizeFileDiffItems } from '@/utils/fileChangeDiff';

export interface V2ToolDetailInput {
  componentType?: AgentComponentTypeEnum | string;
  name?: string;
  result?: unknown;
}

export interface V2ToolDetailStep {
  status: string;
  content: string;
}

export interface NormalizedV2ToolDetail {
  kind: ToolPresentationKind;
  command?: string;
  description?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  query?: string;
  url?: string;
  resultTitle?: string;
  resultSummary?: string;
  skillContent?: string;
  exitCode?: number;
  additions: number;
  deletions: number;
  isCreate: boolean;
  output?: string;
  inputText?: string;
  success?: boolean;
  steps: V2ToolDetailStep[];
  diffs: ReturnType<typeof normalizeFileDiffItems>;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;

const displayText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

/** 只剥离包住整段结果的 Markdown code fence，正文内部 fence 保留。 */
export const stripOuterCodeFence = (value: string): string => {
  const trimmed = value.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  return (match?.[1] ?? trimmed).trim();
};

const readContentItem = (value: unknown): string => {
  const item = asRecord(value);
  if (!item) return displayText(value);
  if (typeof item.content === 'string') return item.content;
  if (typeof item.output === 'string') return item.output;
  const content = asRecord(item.content);
  if (typeof content?.text === 'string') return content.text;
  if (typeof item.text === 'string') return item.text;
  return displayText(value);
};

const readOutput = (result: Record<string, unknown> | undefined): string => {
  if (!result) return '';
  const data = result.data;
  const raw = Array.isArray(data)
    ? data.map(readContentItem).filter(Boolean).join('\n')
    : readContentItem(data);
  return stripOuterCodeFence(raw);
};

const readString = (
  source: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    if (typeof source?.[key] === 'string') return source[key] as string;
  }
  return undefined;
};

const readNumber = (
  source: Record<string, unknown> | undefined,
  keys: string[],
): number | undefined => {
  for (const key of keys) {
    if (typeof source?.[key] === 'number') return source[key] as number;
  }
  return undefined;
};

const countChangedLines = (value?: string): number =>
  value ? value.split(/\r?\n/).length : 0;

export const normalizeV2ToolDetail = ({
  componentType,
  name,
  result,
}: V2ToolDetailInput): NormalizedV2ToolDetail => {
  const resultRecord = asRecord(result);
  const inputEnvelope = asRecord(
    resultRecord?.input ?? resultRecord?.rawInput ?? resultRecord?.raw_input,
  );
  const nestedRawInput = asRecord(
    inputEnvelope?.rawInput ?? inputEnvelope?.raw_input,
  );
  const input = nestedRawInput
    ? { ...inputEnvelope, ...nestedRawInput }
    : inputEnvelope;
  const data = resultRecord?.data;
  const dataRecords = Array.isArray(data)
    ? data
        .map((entry) => asRecord(entry))
        .filter((entry): entry is Record<string, unknown> => !!entry)
    : [];
  const structuredResult = Array.isArray(data)
    ? dataRecords.find(
        (entry) =>
          typeof entry.title === 'string' ||
          typeof entry.summary === 'string' ||
          typeof entry.url === 'string',
      )
    : asRecord(data);
  const steps = Array.isArray(data)
    ? data
        .map((entry) => asRecord(entry))
        .filter(
          (entry): entry is Record<string, unknown> =>
            !!entry && typeof entry.content === 'string',
        )
        .map((entry) => ({
          status: typeof entry.status === 'string' ? entry.status : 'unknown',
          content: entry.content as string,
        }))
    : [];

  const kind = getToolPresentationKind({ componentType, name, result });
  const diffs = normalizeFileDiffItems(
    resultRecord && input ? { ...resultRecord, input } : result,
  );
  const terminalRecord = dataRecords.find(
    (entry) => entry.type === 'terminal' || typeof entry.exitCode === 'number',
  );
  const inputForDisplay = input
    ? Object.fromEntries(
        Object.entries(input).filter(
          ([key]) =>
            ![
              'command',
              'description',
              'file_path',
              'filePath',
              'filepath',
              'skill_content',
              'skillContent',
              'kind',
              'rawInput',
              'raw_input',
            ].includes(key),
        ),
      )
    : undefined;

  return {
    kind,
    command: readString(input, ['command']),
    description: readString(input, ['description']),
    filePath: readString(input, ['file_path', 'filePath', 'filepath', 'path']),
    lineStart: readNumber(input, ['line_start', 'lineStart', 'start_line']),
    lineEnd: readNumber(input, ['line_end', 'lineEnd', 'end_line']),
    query: readString(input, ['query', 'q', 'keyword', 'keywords']),
    url:
      readString(input, ['url', 'uri', 'href']) ??
      readString(structuredResult, ['url', 'uri', 'href']),
    resultTitle: readString(structuredResult, ['title', 'name']),
    resultSummary: readString(structuredResult, [
      'summary',
      'description',
      'snippet',
    ]),
    skillContent: readString(input, ['skill_content', 'skillContent']),
    exitCode:
      readNumber(terminalRecord, ['exitCode', 'exit_code', 'code']) ??
      readNumber(resultRecord, ['exitCode', 'exit_code', 'code']),
    additions: diffs.reduce(
      (total, diff) => total + countChangedLines(diff.newText),
      0,
    ),
    deletions: diffs.reduce(
      (total, diff) => total + countChangedLines(diff.oldText),
      0,
    ),
    isCreate:
      diffs.length > 0 &&
      diffs.every((diff) => !diff.oldText && Boolean(diff.newText)),
    output: readOutput(resultRecord) || undefined,
    inputText:
      inputForDisplay && Object.keys(inputForDisplay).length
        ? displayText(inputForDisplay)
        : undefined,
    success:
      typeof resultRecord?.success === 'boolean'
        ? resultRecord.success
        : undefined,
    steps,
    diffs,
  };
};
