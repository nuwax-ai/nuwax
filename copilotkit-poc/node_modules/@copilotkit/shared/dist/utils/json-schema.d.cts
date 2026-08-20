import { Parameter } from "../types/action.cjs";
import { z } from "zod";

//#region src/utils/json-schema.d.ts
type JSONSchemaString = {
  type: "string";
  description?: string;
  enum?: string[];
};
type JSONSchemaNumber = {
  type: "number";
  description?: string;
};
type JSONSchemaBoolean = {
  type: "boolean";
  description?: string;
};
type JSONSchemaObject = {
  type: "object";
  properties?: Record<string, JSONSchema>;
  required?: string[];
  description?: string;
};
type JSONSchemaArray = {
  type: "array";
  items: JSONSchema;
  description?: string;
};
type JSONSchema = JSONSchemaString | JSONSchemaNumber | JSONSchemaBoolean | JSONSchemaObject | JSONSchemaArray;
declare function actionParametersToJsonSchema(actionParameters: Parameter[]): JSONSchema;
declare function jsonSchemaToActionParameters(jsonSchema: JSONSchema): Parameter[];
declare function convertJsonSchemaToZodSchema(jsonSchema: any, required: boolean, definitions?: Record<string, any>, visitedRefs?: Set<string>): z.ZodSchema;
declare function getZodParameters<T extends [] | Parameter[] | undefined>(parameters: T): any;
//#endregion
export { JSONSchema, JSONSchemaArray, JSONSchemaBoolean, JSONSchemaNumber, JSONSchemaObject, JSONSchemaString, actionParametersToJsonSchema, convertJsonSchemaToZodSchema, getZodParameters, jsonSchemaToActionParameters };
//# sourceMappingURL=json-schema.d.cts.map