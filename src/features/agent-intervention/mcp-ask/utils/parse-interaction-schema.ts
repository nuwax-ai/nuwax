import type {
  InteractionUiOptions,
  InteractionUiSchema,
  InteractionUiStep,
  JsonSchemaProperty,
  McpAskFieldWidget,
} from '../../types/mcp-ask';

export interface ParsedMcpAskField {
  name: string;
  property: JsonSchemaProperty;
  widget: McpAskFieldWidget;
  required: boolean;
  options: InteractionUiOptions;
  enumValues: string[];
  enumLabels: string[];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

/** 读取字段或根 uiSchema 上的 ui:options */
export function getUiOptions(
  uiSchema: Record<string, unknown> | undefined,
  fieldName?: string,
): InteractionUiOptions {
  const root = asRecord(uiSchema?.['ui:options']) ?? {};
  if (!fieldName) {
    return root as InteractionUiOptions;
  }
  const fieldUi = asRecord(uiSchema?.[fieldName]);
  const fieldOpts = asRecord(fieldUi?.['ui:options']) ?? {};
  return { ...root, ...fieldOpts } as InteractionUiOptions;
}

function getRootSchema(ui: InteractionUiSchema): {
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
} {
  const schema = ui.schema as {
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
  return {
    properties: schema?.properties ?? {},
    required: schema?.required ?? [],
  };
}

function resolveEnumLabels(
  enumValues: string[],
  options: InteractionUiOptions,
): string[] {
  if (options.enumNames?.length === enumValues.length) {
    return options.enumNames;
  }
  return enumValues;
}

/**
 * 根据 JSON Schema + uiSchema 推断控件类型
 */
export function resolveFieldWidget(
  name: string,
  prop: JsonSchemaProperty,
  uiSchema?: Record<string, unknown>,
): McpAskFieldWidget {
  const fieldUi = asRecord(uiSchema?.[name]);
  const widget = fieldUi?.['ui:widget'];
  if (typeof widget === 'string') {
    if (
      widget === 'radio' ||
      widget === 'checkboxes' ||
      widget === 'select' ||
      widget === 'text' ||
      widget === 'textarea' ||
      widget === 'radio-with-custom'
    ) {
      return widget;
    }
  }

  const options = getUiOptions(uiSchema, name);
  const propType = Array.isArray(prop.type)
    ? prop.type.find((t) => t !== 'null') || 'string'
    : prop.type;

  if (propType === 'array') {
    const itemEnum = prop.items?.enum;
    if (itemEnum?.length) {
      return 'checkboxes';
    }
  }

  if (prop.enum?.length) {
    if (options.allowCustom || options.otherField) {
      return 'radio-with-custom';
    }
    return 'radio';
  }

  if (propType === 'string') {
    return fieldUi?.['ui:widget'] === 'textarea' ? 'textarea' : 'text';
  }

  return 'text';
}

export function parseInteractionFields(
  ui: InteractionUiSchema,
  fieldNames?: string[],
): ParsedMcpAskField[] {
  const { properties, required } = getRootSchema(ui);
  const names = fieldNames ?? Object.keys(properties);

  return names
    .filter((name) => properties[name])
    .map((name) => {
      const property = properties[name];
      const options = getUiOptions(ui.uiSchema, name);
      const widget = resolveFieldWidget(name, property, ui.uiSchema);
      const enumValues =
        property.enum ??
        (property.items?.enum && widget === 'checkboxes'
          ? property.items.enum
          : []);

      return {
        name,
        property,
        widget,
        required: required.includes(name),
        options,
        enumValues,
        enumLabels: resolveEnumLabels(enumValues, options),
      };
    });
}

/**
 * 是否多步骤向导
 */
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
  const { properties } = getRootSchema(ui);
  const allFields = Object.keys(properties);
  if (!allFields.length) {
    return [];
  }
  return [
    {
      id: 'default',
      title: ui.title,
      description: ui.description,
      fields: allFields,
    },
  ];
}

export function isSkipAllowed(ui: InteractionUiSchema): boolean {
  const rootOpts = getUiOptions(ui.uiSchema);
  return rootOpts.allowSkip === true;
}

export function getSkipLabel(ui: InteractionUiSchema): string | undefined {
  const rootOpts = getUiOptions(ui.uiSchema);
  return ui.skipLabel || rootOpts.skipLabel;
}
