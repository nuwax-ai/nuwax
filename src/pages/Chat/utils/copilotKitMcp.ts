import type { MessageInfo } from '@/types/interfaces/conversationInfo';

type PlainRecord = Record<string, any>;

export interface CopilotKitMcpPayload {
  kind: 'a2ui' | 'mcp-apps';
  sourceMessageId?: string | number;
  title?: string;
  operations?: PlainRecord[];
  surfaceIds?: string[];
  mcpAppsContent?: PlainRecord;
  raw?: unknown;
}

const A2UI_OPERATION_KEYS = [
  'createSurface',
  'updateComponents',
  'updateDataModel',
  'deleteSurface',
];

const MAX_SCAN_DEPTH = 8;
const BASIC_CATALOG_ID =
  'https://a2ui.org/specification/v0_9/basic_catalog.json';

const isPlainRecord = (value: unknown): value is PlainRecord => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const extractJsonBlocks = (text?: string): unknown[] => {
  if (!text) return [];

  const result: unknown[] = [];
  const codeBlockPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null = null;

  while ((match = codeBlockPattern.exec(text))) {
    const parsed = tryParseJson(match[1]);
    if (parsed !== match[1]) {
      result.push(parsed);
    }
  }

  const parsedWholeText = tryParseJson(text);
  if (parsedWholeText !== text) {
    result.push(parsedWholeText);
  }

  return result;
};

const isA2UIOperation = (value: unknown): value is PlainRecord => {
  return (
    isPlainRecord(value) &&
    A2UI_OPERATION_KEYS.some((key) => isPlainRecord(value[key]))
  );
};

const getOperationSurfaceId = (operation: PlainRecord): string => {
  if (typeof operation.surfaceId === 'string') return operation.surfaceId;

  for (const key of A2UI_OPERATION_KEYS) {
    const data = operation[key];
    if (isPlainRecord(data) && typeof data.surfaceId === 'string') {
      return data.surfaceId;
    }
  }

  return 'default';
};

const normalizeComponent = (component: unknown): unknown => {
  if (!isPlainRecord(component)) return component;

  const componentConfig = component.component;
  if (!isPlainRecord(componentConfig)) return component;

  const entries = Object.entries(componentConfig);
  if (entries.length !== 1) return component;

  const [componentName, props] = entries[0];

  return {
    id: component.id,
    component: componentName,
    ...(isPlainRecord(props) ? props : {}),
  };
};

const normalizeA2UIOperation = (operation: PlainRecord): PlainRecord[] => {
  const createSurface = operation.createSurface;
  if (isPlainRecord(createSurface)) {
    return [
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: getOperationSurfaceId(operation),
          catalogId:
            typeof createSurface.catalogId === 'string'
              ? createSurface.catalogId
              : BASIC_CATALOG_ID,
          theme: createSurface.theme || createSurface.styles || {},
          sendDataModel:
            typeof createSurface.sendDataModel === 'boolean'
              ? createSurface.sendDataModel
              : undefined,
        },
      },
    ];
  }

  const updateComponents = operation.updateComponents;
  if (isPlainRecord(updateComponents)) {
    const components = Array.isArray(updateComponents.components)
      ? updateComponents.components.map(normalizeComponent)
      : [];

    return [
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: getOperationSurfaceId(operation),
          components,
        },
      },
    ];
  }

  const updateDataModel = operation.updateDataModel;
  if (isPlainRecord(updateDataModel)) {
    return [
      {
        version: 'v0.9',
        updateDataModel: {
          surfaceId: getOperationSurfaceId(operation),
          path:
            typeof updateDataModel.path === 'string'
              ? updateDataModel.path
              : '/',
          value: updateDataModel.value ?? updateDataModel.contents,
        },
      },
    ];
  }

  const deleteSurface = operation.deleteSurface;
  if (isPlainRecord(deleteSurface)) {
    return [
      {
        version: 'v0.9',
        deleteSurface: {
          surfaceId: getOperationSurfaceId(operation),
        },
      },
    ];
  }

  return [];
};

const uniq = <T>(list: T[]): T[] => Array.from(new Set(list));

const normalizeA2UIOperations = (operations: PlainRecord[]): PlainRecord[] => {
  const normalizedOperations = operations.flatMap(normalizeA2UIOperation);
  const hasCreateSurface = normalizedOperations.some((operation) =>
    isPlainRecord(operation.createSurface),
  );

  if (hasCreateSurface) return normalizedOperations;

  const surfaceIds = uniq(normalizedOperations.map(getOperationSurfaceId));
  return [
    ...surfaceIds.map((surfaceId) => ({
      version: 'v0.9',
      createSurface: {
        surfaceId,
        catalogId: BASIC_CATALOG_ID,
        theme: {},
      },
    })),
    ...normalizedOperations,
  ];
};

const isMcpAppsContent = (value: unknown): value is PlainRecord => {
  return (
    isPlainRecord(value) &&
    isPlainRecord(value.result) &&
    typeof value.resourceUri === 'string' &&
    typeof value.serverHash === 'string'
  );
};

const collectPayloads = (
  value: unknown,
  result: CopilotKitMcpPayload[],
  depth = 0,
) => {
  if (depth > MAX_SCAN_DEPTH || value === null || value === undefined) return;

  const parsed = tryParseJson(value);

  if (Array.isArray(parsed)) {
    if (parsed.length > 0 && parsed.every(isA2UIOperation)) {
      const operations = normalizeA2UIOperations(parsed);
      const surfaceIds = uniq(operations.map(getOperationSurfaceId));
      result.push({
        kind: 'a2ui',
        operations,
        surfaceIds,
        raw: parsed,
      });
      return;
    }

    parsed.forEach((item) => collectPayloads(item, result, depth + 1));
    return;
  }

  if (!isPlainRecord(parsed)) return;

  if (isMcpAppsContent(parsed)) {
    result.push({
      kind: 'mcp-apps',
      mcpAppsContent: parsed,
      title: parsed.title || parsed.name,
      raw: parsed,
    });
  }

  const activityType = parsed.activityType || parsed.type || parsed.eventType;
  const content = parsed.content || parsed.data || parsed.payload;
  if (activityType === 'mcp-apps' && isMcpAppsContent(content)) {
    result.push({
      kind: 'mcp-apps',
      mcpAppsContent: content,
      title: parsed.title || parsed.name,
      raw: parsed,
    });
  }

  const operations =
    parsed.a2ui_operations ||
    parsed.a2uiOperations ||
    parsed.operations ||
    parsed.uiOperations;
  if (Array.isArray(operations) && operations.some(isA2UIOperation)) {
    const validOperations = normalizeA2UIOperations(
      operations.filter(isA2UIOperation),
    );
    const surfaceIds = uniq(validOperations.map(getOperationSurfaceId));
    result.push({
      kind: 'a2ui',
      operations: validOperations,
      surfaceIds,
      title: parsed.title || parsed.name,
      raw: parsed,
    });
  }

  Object.values(parsed).forEach((item) => {
    collectPayloads(item, result, depth + 1);
  });
};

export const extractCopilotKitMcpPayload = (
  message: MessageInfo,
): CopilotKitMcpPayload | null => {
  const candidates: unknown[] = [
    message.metadata,
    message.finalResult,
    message.processingList,
    message.componentExecutedList,
    ...extractJsonBlocks(message.text),
  ];

  const payloads: CopilotKitMcpPayload[] = [];
  candidates.forEach((candidate) => collectPayloads(candidate, payloads));

  const payload = payloads[payloads.length - 1];
  if (!payload) return null;

  return {
    ...payload,
    sourceMessageId: message.id,
  };
};

export const findLatestCopilotKitMcpPayload = (
  messageList: MessageInfo[],
): CopilotKitMcpPayload | null => {
  for (let index = messageList.length - 1; index >= 0; index -= 1) {
    const payload = extractCopilotKitMcpPayload(messageList[index]);
    if (payload) return payload;
  }

  return null;
};
