import { SerializableSchema } from "../standard_schema.js";

//#region src/utils/types/zod.d.ts
interface ZodV3TypeDef {
  typeName?: string;
  description?: string;
  [key: string]: any;
}
interface ZodV3Like<Output = any, Input = Output> {
  readonly _type: Output;
  readonly _output: Output;
  readonly _input: Input;
  readonly _def: ZodV3TypeDef;
  readonly description?: string;
  parse(data: unknown, params?: any): Output;
  safeParse(data: unknown, params?: any): {
    success: boolean;
    data?: Output;
    error?: unknown;
  };
  parseAsync(data: unknown, params?: any): Promise<Output>;
  safeParseAsync(data: unknown, params?: any): Promise<{
    success: boolean;
    data?: Output;
    error?: unknown;
  }>;
  optional?(): ZodV3Like<Output | undefined, Input | undefined>;
  "~standard"?: any;
}
interface ZodV3ObjectLike extends ZodV3Like {
  readonly shape: Record<string, any>;
  extend(augmentation: Record<string, any>): ZodV3ObjectLike;
  partial(): ZodV3ObjectLike;
  strict(): ZodV3ObjectLike;
  passthrough(): ZodV3ObjectLike;
}
interface ZodV4Internals<O = any, I = any> {
  def: any;
  output: O;
  input: I;
  [key: string]: any;
}
interface ZodV4Like<Output = any, Input = Output> {
  _zod: ZodV4Internals<Output, Input>;
  "~standard"?: any;
}
interface ZodV4ObjectLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: {
      type: "object";
      shape: Record<string, any>;
      [key: string]: any;
    };
  };
}
interface ZodV4ArrayLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: {
      type: "array";
      element: ZodV4Like;
      [key: string]: unknown;
    };
  };
}
interface ZodV4OptionalLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: {
      type: "optional";
      innerType: ZodV4Like;
      [key: string]: unknown;
    };
  };
}
interface ZodV4NullableLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: {
      type: "nullable";
      innerType: ZodV4Like;
      [key: string]: unknown;
    };
  };
}
interface ZodV4PipeLike extends ZodV4Like {
  _zod: ZodV4Internals & {
    def: {
      type: "pipe";
      in: InteropZodType;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}
interface ZodV3EffectsLike extends ZodV3Like {
  _def: ZodV3TypeDef & {
    typeName: "ZodEffects";
    schema: InteropZodType;
  };
}
type ZodStringV3 = ZodV3Like<string>;
type ZodStringV4 = ZodV4Like<string, unknown>;
type ZodObjectV3 = ZodV3ObjectLike;
type ZodObjectV4 = ZodV4ObjectLike;
type ZodObjectV4Classic = ZodV4ObjectLike;
type ZodObjectMain = ZodV4ObjectLike;
type ZodDefaultV3<T extends ZodV3Like> = ZodV3Like<T extends ZodV3Like<infer O, any> ? O : any>;
type ZodDefaultV4<T extends ZodV4Like> = ZodV4Like<T extends ZodV4Like<infer O, any> ? O : any>;
type ZodOptionalV3<T extends ZodV3Like> = ZodV3Like<T extends ZodV3Like<infer O, any> ? O | undefined : any>;
type ZodOptionalV4<T extends ZodV4Like> = ZodV4Like<T extends ZodV4Like<infer O, any> ? O | undefined : any>;
type ZodNullableV4<T extends ZodV4Like> = ZodV4Like<T extends ZodV4Like<infer O, any> ? O | null : any>;
type InteropZodType<Output = any, Input = Output> = ZodV3Like<Output, Input> | ZodV4Like<Output, Input>;
type InteropZodObject = ZodV3ObjectLike | ZodV4ObjectLike;
type InteropZodDefault<T = InteropZodObject> = T extends ZodV3Like ? ZodDefaultV3<T> : T extends ZodV4Like ? ZodDefaultV4<T> : never;
type InteropZodOptional<T = InteropZodObject> = T extends ZodV3Like ? ZodOptionalV3<T> : T extends ZodV4Like ? ZodOptionalV4<T> : never;
type InteropZodObjectShape<T extends InteropZodObject = InteropZodObject> = T extends ZodV3ObjectLike ? { [K in keyof T["shape"]]: T["shape"][K] } : T extends ZodV4ObjectLike ? { [K in keyof T["_zod"]["def"]["shape"]]: T["_zod"]["def"]["shape"][K] } : never;
interface InteropZodIssue {
  message: string;
  path: (string | number)[];
  [key: string]: unknown;
}
type InferInteropZodInput<T> = T extends ZodV3Like<unknown, infer Input> ? Input : T extends ZodV4Like<unknown, infer Input> ? Input : T extends {
  _zod: {
    input: infer Input;
  };
} ? Input : never;
type InferInteropZodOutput<T> = T extends ZodV3Like<infer Output, unknown> ? Output : T extends ZodV4Like<infer Output, unknown> ? Output : T extends {
  _zod: {
    output: infer Output;
  };
} ? Output : never;
type InteropZodLiteral = ZodV3Like | ZodV4Like;
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
declare function isZodSchemaV4(schema: unknown): schema is ZodV4Like<unknown, unknown>;
declare function isZodSchemaV3(schema: unknown): schema is ZodV3Like<unknown, unknown>;
/** Backward compatible isZodSchema for Zod 3 */
declare function isZodSchema<RunOutput extends Record<string, unknown> = Record<string, unknown>>(schema: ZodV3Like<RunOutput> | Record<string, unknown>): schema is ZodV3Like<RunOutput>;
/**
 * Given either a Zod schema, or plain object, determine if the input is a Zod schema.
 *
 * @param {unknown} input
 * @returns {boolean} Whether or not the provided input is a Zod schema.
 */
declare function isInteropZodSchema(input: unknown): input is InteropZodType;
declare function isZodLiteralV3(obj: unknown): obj is ZodV3Like;
declare function isZodLiteralV4(obj: unknown): obj is ZodV4Like;
/**
 * Determines if the provided value is an InteropZodLiteral (Zod v3 or v4 literal schema).
 *
 * @param obj The value to check.
 * @returns {boolean} True if the value is a Zod v3 or v4 literal schema, false otherwise.
 */
declare function isInteropZodLiteral(obj: unknown): obj is InteropZodLiteral;
interface InteropZodError {
  issues: InteropZodIssue[];
}
type InteropZodSafeParseResult<T> = {
  success: true;
  data: T;
  error?: never;
} | {
  success: false;
  error: InteropZodError;
  data?: never;
};
/**
 * Asynchronously parses the input using the provided Zod schema (v3 or v4) and returns a safe parse result.
 * This function handles both Zod v3 and v4 schemas, returning a result object indicating success or failure.
 *
 * @template T - The expected output type of the schema.
 * @param {InteropZodType<T>} schema - The Zod schema (v3 or v4) to use for parsing.
 * @param {unknown} input - The input value to parse.
 * @returns {Promise<InteropZodSafeParseResult<T>>} A promise that resolves to a safe parse result object.
 * @throws {Error} If the schema is not a recognized Zod v3 or v4 schema.
 */
declare function interopSafeParseAsync<T>(schema: InteropZodType<T>, input: unknown): Promise<InteropZodSafeParseResult<T>>;
/**
 * Asynchronously parses the input using the provided Zod schema (v3 or v4) and returns the parsed value.
 * Throws an error if parsing fails or if the schema is not a recognized Zod v3 or v4 schema.
 *
 * @template T - The expected output type of the schema.
 * @param {InteropZodType<T>} schema - The Zod schema (v3 or v4) to use for parsing.
 * @param {unknown} input - The input value to parse.
 * @returns {Promise<T>} A promise that resolves to the parsed value.
 * @throws {Error} If parsing fails or the schema is not a recognized Zod v3 or v4 schema.
 */
declare function interopParseAsync<T>(schema: InteropZodType<T>, input: unknown): Promise<T>;
/**
 * Safely parses the input using the provided Zod schema (v3 or v4) and returns a result object
 * indicating success or failure. This function is compatible with both Zod v3 and v4 schemas.
 *
 * @template T - The expected output type of the schema.
 * @param {InteropZodType<T>} schema - The Zod schema (v3 or v4) to use for parsing.
 * @param {unknown} input - The input value to parse.
 * @returns {InteropZodSafeParseResult<T>} An object with either the parsed data (on success)
 *   or the error (on failure).
 * @throws {Error} If the schema is not a recognized Zod v3 or v4 schema.
 */
declare function interopSafeParse<T>(schema: InteropZodType<T>, input: unknown): InteropZodSafeParseResult<T>;
/**
 * Parses the input using the provided Zod schema (v3 or v4) and returns the parsed value.
 * Throws an error if parsing fails or if the schema is not a recognized Zod v3 or v4 schema.
 *
 * @template T - The expected output type of the schema.
 * @param {InteropZodType<T>} schema - The Zod schema (v3 or v4) to use for parsing.
 * @param {unknown} input - The input value to parse.
 * @returns {T} The parsed value.
 * @throws {Error} If parsing fails or the schema is not a recognized Zod v3 or v4 schema.
 */
declare function interopParse<T>(schema: InteropZodType<T>, input: unknown): T;
/**
 * Retrieves the description from a schema definition (v3, v4, standard schema, or plain object), if available.
 *
 * @param {unknown} schema - The schema to extract the description from.
 * @returns {string | undefined} The description of the schema, or undefined if not present.
 */
declare function getSchemaDescription(schema: SerializableSchema | InteropZodType<unknown> | Record<string, unknown>): string | undefined;
/**
 * Determines if the provided Zod schema is "shapeless".
 * A shapeless schema is one that does not define any object shape,
 * such as ZodString, ZodNumber, ZodBoolean, ZodAny, etc.
 * For ZodObject, it must have no shape keys to be considered shapeless.
 * ZodRecord schemas are considered shapeless since they define dynamic
 * key-value mappings without fixed keys.
 *
 * @param schema The Zod schema to check.
 * @returns {boolean} True if the schema is shapeless, false otherwise.
 */
declare function isShapelessZodSchema(schema: unknown): boolean;
/**
 * Determines if the provided Zod schema should be treated as a simple string schema
 * that maps to DynamicTool. This aligns with the type-level constraint of
 * InteropZodType<string | undefined> which only matches basic string schemas.
 * If the provided schema is just z.string(), we can make the determination that
 * the tool is just a generic string tool that doesn't require any input validation.
 *
 * This function only returns true for basic ZodString schemas, including:
 * - Basic string schemas (z.string())
 * - String schemas with validations (z.string().min(1), z.string().email(), etc.)
 *
 * This function returns false for everything else, including:
 * - String schemas with defaults (z.string().default("value"))
 * - Branded string schemas (z.string().brand<"UserId">())
 * - String schemas with catch operations (z.string().catch("default"))
 * - Optional/nullable string schemas (z.string().optional())
 * - Transformed schemas (z.string().transform() or z.object().transform())
 * - Object or record schemas, even if they're empty
 * - Any other schema type
 *
 * @param schema The Zod schema to check.
 * @returns {boolean} True if the schema is a basic ZodString, false otherwise.
 */
declare function isSimpleStringZodSchema(schema: unknown): schema is InteropZodType<string | undefined>;
declare function isZodObjectV3(obj: unknown): obj is ZodObjectV3;
declare function isZodObjectV4(obj: unknown): obj is ZodV4ObjectLike;
declare function isZodArrayV4(obj: unknown): obj is ZodV4ArrayLike;
declare function isZodOptionalV4(obj: unknown): obj is ZodV4OptionalLike;
declare function isZodNullableV4(obj: unknown): obj is ZodV4NullableLike;
/**
 * Determines if the provided value is an InteropZodObject (Zod v3 or v4 object schema).
 *
 * @param obj The value to check.
 * @returns {boolean} True if the value is a Zod v3 or v4 object schema, false otherwise.
 */
declare function isInteropZodObject(obj: unknown): obj is InteropZodObject;
/**
 * Retrieves the shape (fields) of a Zod object schema, supporting both Zod v3 and v4.
 *
 * @template T - The type of the Zod object schema.
 * @param {T} schema - The Zod object schema instance (either v3 or v4).
 * @returns {InteropZodObjectShape<T>} The shape of the object schema.
 * @throws {Error} If the schema is not a Zod v3 or v4 object.
 */
declare function getInteropZodObjectShape<T extends InteropZodObject>(schema: T): InteropZodObjectShape<T>;
/**
 * Extends a Zod object schema with additional fields, supporting both Zod v3 and v4.
 *
 * @template T - The type of the Zod object schema.
 * @param {T} schema - The Zod object schema instance (either v3 or v4).
 * @param {InteropZodObjectShape} extension - The fields to add to the schema.
 * @returns {InteropZodObject} The extended Zod object schema.
 * @throws {Error} If the schema is not a Zod v3 or v4 object.
 */
declare function extendInteropZodObject<T extends InteropZodObject>(schema: T, extension: InteropZodObjectShape): InteropZodObject;
/**
 * Returns a partial version of a Zod object schema, making all fields optional.
 * Supports both Zod v3 and v4.
 *
 * @template T - The type of the Zod object schema.
 * @param {T} schema - The Zod object schema instance (either v3 or v4).
 * @returns {InteropZodObject} The partial Zod object schema.
 * @throws {Error} If the schema is not a Zod v3 or v4 object.
 */
declare function interopZodObjectPartial<T extends InteropZodObject>(schema: T): InteropZodObject;
/**
 * Returns a strict version of a Zod object schema, disallowing unknown keys.
 * Supports both Zod v3 and v4 object schemas. If `recursive` is true, applies strictness
 * recursively to all nested object schemas and arrays of object schemas.
 *
 * @template T - The type of the Zod object schema.
 * @param {T} schema - The Zod object schema instance (either v3 or v4).
 * @param {boolean} [recursive=false] - Whether to apply strictness recursively to nested objects/arrays.
 * @returns {InteropZodObject} The strict Zod object schema.
 * @throws {Error} If the schema is not a Zod v3 or v4 object.
 */
declare function interopZodObjectStrict<T extends InteropZodObject>(schema: T, recursive?: boolean): InteropZodObject;
/**
 * Returns a passthrough version of a Zod object schema, allowing unknown keys.
 * Supports both Zod v3 and v4 object schemas. If `recursive` is true, applies passthrough
 * recursively to all nested object schemas and arrays of object schemas.
 *
 * @template T - The type of the Zod object schema.
 * @param {T} schema - The Zod object schema instance (either v3 or v4).
 * @param {boolean} [recursive=false] - Whether to apply passthrough recursively to nested objects/arrays.
 * @returns {InteropZodObject} The passthrough Zod object schema.
 * @throws {Error} If the schema is not a Zod v3 or v4 object.
 */
declare function interopZodObjectPassthrough<T extends InteropZodObject>(schema: T, recursive?: boolean): InteropZodObject;
/**
 * Returns a getter function for the default value of a Zod schema, if one is defined.
 * Supports both Zod v3 and v4 schemas. If the schema has a default value,
 * the returned function will return that value when called. If no default is defined,
 * returns undefined.
 *
 * @template T - The type of the Zod schema.
 * @param {T} schema - The Zod schema instance (either v3 or v4).
 * @returns {(() => InferInteropZodOutput<T>) | undefined} A function that returns the default value, or undefined if no default is set.
 */
declare function getInteropZodDefaultGetter<T extends InteropZodType>(schema: T): (() => InferInteropZodOutput<T>) | undefined;
/**
 * Returns the input type of a Zod transform schema, for both v3 and v4.
 * If the schema is not a transform, returns undefined. If `recursive` is true,
 * recursively processes nested object schemas and arrays of object schemas.
 *
 * @param schema - The Zod schema instance (v3 or v4)
 * @param {boolean} [recursive=false] - Whether to recursively process nested objects/arrays.
 * @returns The input Zod schema of the transform, or undefined if not a transform
 */
declare function interopZodTransformInputSchema(schema: InteropZodType, recursive?: boolean): InteropZodType;
/**
 * Creates a modified version of a Zod object schema where fields matching a predicate are made optional.
 * Supports both Zod v3 and v4 schemas and preserves the original schema version.
 *
 * @template T - The type of the Zod object schema.
 * @param {T} schema - The Zod object schema instance (either v3 or v4).
 * @param {(key: string, value: InteropZodType) => boolean} predicate - Function to determine which fields should be optional.
 * @returns {InteropZodObject} The modified Zod object schema.
 * @throws {Error} If the schema is not a Zod v3 or v4 object.
 */
declare function interopZodObjectMakeFieldsOptional<T extends InteropZodObject>(schema: T, predicate: (key: string, value: InteropZodType) => boolean): InteropZodObject;
declare function isInteropZodError(e: unknown): boolean;
//#endregion
export { InferInteropZodInput, InferInteropZodOutput, InteropZodDefault, InteropZodError, InteropZodIssue, InteropZodLiteral, InteropZodObject, InteropZodObjectShape, InteropZodOptional, InteropZodType, Mutable, ZodDefaultV3, ZodDefaultV4, ZodNullableV4, ZodObjectMain, ZodObjectV3, ZodObjectV4, ZodObjectV4Classic, ZodOptionalV3, ZodOptionalV4, ZodStringV3, ZodStringV4, ZodV3EffectsLike, ZodV3Like, ZodV3ObjectLike, ZodV3TypeDef, ZodV4ArrayLike, ZodV4Internals, ZodV4Like, ZodV4NullableLike, ZodV4ObjectLike, ZodV4OptionalLike, ZodV4PipeLike, extendInteropZodObject, getInteropZodDefaultGetter, getInteropZodObjectShape, getSchemaDescription, interopParse, interopParseAsync, interopSafeParse, interopSafeParseAsync, interopZodObjectMakeFieldsOptional, interopZodObjectPartial, interopZodObjectPassthrough, interopZodObjectStrict, interopZodTransformInputSchema, isInteropZodError, isInteropZodLiteral, isInteropZodObject, isInteropZodSchema, isShapelessZodSchema, isSimpleStringZodSchema, isZodArrayV4, isZodLiteralV3, isZodLiteralV4, isZodNullableV4, isZodObjectV3, isZodObjectV4, isZodOptionalV4, isZodSchema, isZodSchemaV3, isZodSchemaV4 };
//# sourceMappingURL=zod.d.ts.map