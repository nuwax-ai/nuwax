import type {
  InteractionUiOptions,
  InteractionUiSchema,
  InteractionUiStep,
  JsonSchemaProperty,
  McpAskFieldWidget,
} from '@/types/interfaces/mcpAskIntervention';

export interface ParsedMcpAskField {
  name: string;
  property: JsonSchemaProperty;
  widget: McpAskFieldWidget;
  required: boolean;
  options: InteractionUiOptions;
  enumValues: string[];
  enumLabels: string[];
}

const SCHEMA_META_KEYS = new Set([
  'type',
  'title',
  'description',
  'required',
  'properties',
  'schema',
  'uiSchema',
  'steps',
]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isJsonSchemaProperty(value: unknown): value is JsonSchemaProperty {
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  return (
    typeof record.type === 'string' ||
    Array.isArray(record.type) ||
    typeof record.title === 'string' ||
    typeof record.description === 'string' ||
    Array.isArray(record.enum) ||
    !!record.items
  );
}

function normalizeProperties(
  value: unknown,
): Record<string, JsonSchemaProperty> {
  const record = asRecord(value);
  if (!record) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record).filter(
      ([key, property]) =>
        !SCHEMA_META_KEYS.has(key) && isJsonSchemaProperty(property),
    ),
  ) as Record<string, JsonSchemaProperty>;
}

function findSchemaCandidates(
  ui: InteractionUiSchema,
): Record<string, unknown>[] {
  const schema = asRecord(ui.schema);
  if (!schema) {
    return [];
  }

  return [
    schema,
    asRecord(schema.schema),
    asRecord(schema.properties),
    asRecord(asRecord(schema.properties)?.schema),
  ].filter(Boolean) as Record<string, unknown>[];
}

function getEffectiveUiSchema(
  ui: InteractionUiSchema,
): Record<string, unknown> | undefined {
  if (ui.uiSchema) {
    return ui.uiSchema;
  }

  for (const candidate of findSchemaCandidates(ui)) {
    const nestedUiSchema =
      asRecord(candidate.uiSchema) ??
      asRecord(asRecord(candidate.properties)?.uiSchema);
    if (nestedUiSchema) {
      return nestedUiSchema;
    }
  }

  return undefined;
}

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
  for (const candidate of findSchemaCandidates(ui)) {
    const nestedProperties = normalizeProperties(candidate.properties);
    const properties = Object.keys(nestedProperties).length
      ? nestedProperties
      : normalizeProperties(candidate);
    const directRequired = asStringArray(candidate.required);
    const required = directRequired.length
      ? directRequired
      : asStringArray(asRecord(candidate.properties)?.required);
    if (Object.keys(properties).length) {
      return { properties, required };
    }
  }

  return {
    properties: {},
    required: [],
  };
}

function resolveEnumLabels(
  enumValues: string[],
  property: JsonSchemaProperty,
  options: InteractionUiOptions,
): string[] {
  if (options.enumNames?.length === enumValues.length) {
    return options.enumNames;
  }
  const propertyEnumNames = (
    property as JsonSchemaProperty & {
      enumNames?: string[];
    }
  ).enumNames;
  if (propertyEnumNames?.length === enumValues.length) {
    return propertyEnumNames;
  }
  return enumValues;
}

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
  const uiSchema = getEffectiveUiSchema(ui);
  const names = fieldNames ?? Object.keys(properties);

  return names
    .filter((name) => properties[name])
    .map((name) => {
      const property = properties[name];
      const options = getUiOptions(uiSchema, name);
      const widget = resolveFieldWidget(name, property, uiSchema);
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
        enumLabels: resolveEnumLabels(enumValues, property, options),
      };
    });
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
