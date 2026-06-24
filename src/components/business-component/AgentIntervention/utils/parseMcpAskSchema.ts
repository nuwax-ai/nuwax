import type {
  FieldOption,
  FormField,
  InteractionUiOptions,
  InteractionUiSchema,
  InteractionUiStep,
  JsonSchemaProperty,
  McpAskFieldWidget,
} from '../types/mcpAskIntervention';
import { MCP_ASK_WIDGET_TYPES } from '../types/mcpAskIntervention';

/**
 * 解析后的字段:形状对齐渲染层(McpAskFormField)的读取路径,故渲染组件无需改动。
 * `property` 为从 v2 FormField 重建的 JsonSchema 约束视图。
 */
export interface ParsedMcpAskField {
  name: string;
  property: JsonSchemaProperty;
  widget: McpAskFieldWidget;
  required: boolean;
  options: InteractionUiOptions;
  enumValues: string[];
  enumLabels: string[];
}

function isKnownWidget(widget: unknown): widget is McpAskFieldWidget {
  return (
    typeof widget === 'string' &&
    (MCP_ASK_WIDGET_TYPES as readonly string[]).includes(widget)
  );
}

function isFieldOption(opt: unknown): opt is FieldOption {
  return (
    !!opt &&
    typeof opt === 'object' &&
    typeof (opt as FieldOption).value === 'string' &&
    typeof (opt as FieldOption).label === 'string'
  );
}

/** 把 v2 FormField 重建为 JsonSchema 约束视图(FormField 组件读取路径)。 */
function buildProperty(field: FormField): JsonSchemaProperty {
  return {
    type: field.type,
    title: field.title,
    description: field.description,
    minimum: field.minimum,
    maximum: field.maximum,
    multipleOf: field.multipleOf,
    minLength: field.minLength,
    maxLength: field.maxLength,
  };
}

function buildOptions(field: FormField): InteractionUiOptions {
  return {
    placeholder: field.placeholder,
    allowCustom: field.allowCustom,
    otherValue: field.otherValue,
    otherField: field.otherField,
    accept: field.accept,
    multiple: field.multiple,
  };
}

function parseField(field: FormField): ParsedMcpAskField {
  const options = Array.isArray(field.options)
    ? field.options.filter(isFieldOption)
    : [];
  return {
    name: field.name,
    property: buildProperty(field),
    widget: isKnownWidget(field.widget) ? field.widget : 'text',
    required: field.required === true,
    options: buildOptions(field),
    enumValues: options.map((opt) => opt.value),
    enumLabels: options.map((opt) => opt.label),
  };
}

/**
 * 解析 v2 表单字段:遍历 `ui.fields[]`,数组顺序即展示顺序。
 * 传入 `fieldNames`(wizard 步骤)时,按其顺序与名称过滤对应字段。
 */
export function parseInteractionFields(
  ui: InteractionUiSchema,
  fieldNames?: string[],
): ParsedMcpAskField[] {
  const fields = ui.fields ?? [];
  if (!fieldNames?.length) {
    return fields.map(parseField);
  }
  const byName = new Map(fields.map((f) => [f.name, f]));
  return fieldNames
    .map((name) => byName.get(name))
    .filter((f): f is FormField => !!f)
    .map(parseField);
}

export function isWizardPresentation(ui: InteractionUiSchema): boolean {
  return (
    ui.presentation === 'wizard' ||
    (Array.isArray(ui.steps) && ui.steps.length > 1)
  );
}

export function getInteractionSteps(
  ui: InteractionUiSchema,
): InteractionUiStep[] {
  if (ui.steps?.length) {
    return ui.steps;
  }
  const fields = ui.fields ?? [];
  if (!fields.length) {
    return [];
  }
  return [
    {
      id: 'default',
      title: ui.title,
      description: ui.description,
      fields: fields.map((f) => f.name),
    },
  ];
}

/** 是否允许跳过:v2 由 ui.allowSkip 顶层字段控制(旧 v1 的 uiSchema.ui:options.allowSkip 已移除)。 */
export function isSkipAllowed(ui: InteractionUiSchema): boolean {
  return ui.allowSkip === true;
}

export function getSkipLabel(ui: InteractionUiSchema): string | undefined {
  return ui.skipLabel;
}

/** JSON Schema 主类型(忽略 null 联合成员)。McpAskFormField 用于判断 integer。 */
export function getJsonSchemaPrimaryType(
  prop: Pick<JsonSchemaProperty, 'type'>,
): string {
  if (Array.isArray(prop.type)) {
    return prop.type.find((t) => t !== 'null') || 'string';
  }
  return prop.type || 'string';
}
