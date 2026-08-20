/** @category Introspection */
import type { GraphQLField, GraphQLNamedType } from './definition';
import { GraphQLEnumType, GraphQLObjectType } from './definition';
/** The introspection type describing a GraphQL schema. */
export declare const __Schema: GraphQLObjectType;
/** The introspection type describing a GraphQL directive. */
export declare const __Directive: GraphQLObjectType;
/** The introspection enum describing directive locations. */
export declare const __DirectiveLocation: GraphQLEnumType;
/** The introspection type describing GraphQL types. */
export declare const __Type: GraphQLObjectType;
/** The introspection type describing object and interface fields. */
export declare const __Field: GraphQLObjectType;
/** The introspection type describing arguments and input fields. */
export declare const __InputValue: GraphQLObjectType;
/** The introspection type describing enum values. */
export declare const __EnumValue: GraphQLObjectType;
/**
 * The introspection enum describing the different kinds of GraphQL types.
 * @category Introspection
 */
declare enum TypeKind {
  /** A scalar type. */
  SCALAR = 'SCALAR',
  /** An object type. */
  OBJECT = 'OBJECT',
  /** An interface type. */
  INTERFACE = 'INTERFACE',
  /** A union type. */
  UNION = 'UNION',
  /** An enum type. */
  ENUM = 'ENUM',
  /** An input object type. */
  INPUT_OBJECT = 'INPUT_OBJECT',
  /** A list wrapper type. */
  LIST = 'LIST',
  /** A non-null wrapper type. */
  NON_NULL = 'NON_NULL',
}
export { TypeKind };
/** The introspection enum describing GraphQL type kinds. */
export declare const __TypeKind: GraphQLEnumType;
/**
 * Note that these are GraphQLField and not GraphQLFieldConfig,
 * so the format for args is different.
 */
export declare const SchemaMetaFieldDef: GraphQLField<unknown, unknown>;
/** The `__type` meta field definition used by introspection. */
export declare const TypeMetaFieldDef: GraphQLField<unknown, unknown>;
/** The `__typename` meta field definition used by execution and introspection. */
export declare const TypeNameMetaFieldDef: GraphQLField<unknown, unknown>;
/** All introspection types defined by the GraphQL specification. */
export declare const introspectionTypes: ReadonlyArray<GraphQLNamedType>;
/**
 * Returns true when the type is one of the built-in introspection types.
 * @param type - The GraphQL type to inspect.
 * @returns True when the type is one of the built-in introspection types.
 * @example
 * ```ts
 * import { GraphQLString, isIntrospectionType, __Type } from 'graphql/type';
 *
 * isIntrospectionType(__Type); // => true
 * isIntrospectionType(GraphQLString); // => false
 * ```
 */
export declare function isIntrospectionType(type: GraphQLNamedType): boolean;
