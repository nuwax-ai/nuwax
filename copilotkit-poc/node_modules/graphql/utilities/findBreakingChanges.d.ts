/** @category Schema Changes */
import type { GraphQLSchema } from '../type/schema';
/** Categories of schema changes that may break existing operations. */
declare enum BreakingChangeType {
  /** Breaking change code for type removed. */
  TYPE_REMOVED = 'TYPE_REMOVED',
  /** Breaking change code for type changed kind. */
  TYPE_CHANGED_KIND = 'TYPE_CHANGED_KIND',
  /** Breaking change code for type removed from union. */
  TYPE_REMOVED_FROM_UNION = 'TYPE_REMOVED_FROM_UNION',
  /** Breaking change code for value removed from enum. */
  VALUE_REMOVED_FROM_ENUM = 'VALUE_REMOVED_FROM_ENUM',
  /** Breaking change code for required input field added. */
  REQUIRED_INPUT_FIELD_ADDED = 'REQUIRED_INPUT_FIELD_ADDED',
  /** Breaking change code for implemented interface removed. */
  IMPLEMENTED_INTERFACE_REMOVED = 'IMPLEMENTED_INTERFACE_REMOVED',
  /** Breaking change code for field removed. */
  FIELD_REMOVED = 'FIELD_REMOVED',
  /** Breaking change code for field changed kind. */
  FIELD_CHANGED_KIND = 'FIELD_CHANGED_KIND',
  /** Breaking change code for required arg added. */
  REQUIRED_ARG_ADDED = 'REQUIRED_ARG_ADDED',
  /** Breaking change code for arg removed. */
  ARG_REMOVED = 'ARG_REMOVED',
  /** Breaking change code for arg changed kind. */
  ARG_CHANGED_KIND = 'ARG_CHANGED_KIND',
  /** Breaking change code for directive removed. */
  DIRECTIVE_REMOVED = 'DIRECTIVE_REMOVED',
  /** Breaking change code for directive arg removed. */
  DIRECTIVE_ARG_REMOVED = 'DIRECTIVE_ARG_REMOVED',
  /** Breaking change code for required directive arg added. */
  REQUIRED_DIRECTIVE_ARG_ADDED = 'REQUIRED_DIRECTIVE_ARG_ADDED',
  /** Breaking change code for directive repeatable removed. */
  DIRECTIVE_REPEATABLE_REMOVED = 'DIRECTIVE_REPEATABLE_REMOVED',
  /** Breaking change code for directive location removed. */
  DIRECTIVE_LOCATION_REMOVED = 'DIRECTIVE_LOCATION_REMOVED',
}
export { BreakingChangeType };
/** Categories of schema changes that may be dangerous for existing operations. */
declare enum DangerousChangeType {
  /** Dangerous change code for value added to enum. */
  VALUE_ADDED_TO_ENUM = 'VALUE_ADDED_TO_ENUM',
  /** Dangerous change code for type added to union. */
  TYPE_ADDED_TO_UNION = 'TYPE_ADDED_TO_UNION',
  /** Dangerous change code for optional input field added. */
  OPTIONAL_INPUT_FIELD_ADDED = 'OPTIONAL_INPUT_FIELD_ADDED',
  /** Dangerous change code for optional arg added. */
  OPTIONAL_ARG_ADDED = 'OPTIONAL_ARG_ADDED',
  /** Dangerous change code for implemented interface added. */
  IMPLEMENTED_INTERFACE_ADDED = 'IMPLEMENTED_INTERFACE_ADDED',
  /** Dangerous change code for arg default value change. */
  ARG_DEFAULT_VALUE_CHANGE = 'ARG_DEFAULT_VALUE_CHANGE',
}
export { DangerousChangeType };
/** Description of a schema change that may break existing operations. */
export interface BreakingChange {
  /** Specific kind of breaking schema change. */
  type: BreakingChangeType;
  /** Human-readable description of the breaking schema change. */
  description: string;
}
/** Description of a schema change that may be dangerous for existing operations. */
export interface DangerousChange {
  /** Specific kind of dangerous schema change. */
  type: DangerousChangeType;
  /** Human-readable description of the dangerous schema change. */
  description: string;
}
/**
 * Given two schemas, returns an Array containing descriptions of all the types
 * of breaking changes covered by the other functions down below.
 * @param oldSchema - Schema before the change.
 * @param newSchema - Schema after the change.
 * @returns Breaking changes between the two schemas.
 * @example
 * ```ts
 * import { buildSchema, findBreakingChanges } from 'graphql/utilities';
 *
 * const oldSchema = buildSchema(`
 *   type User {
 *     id: ID!
 *     name: String
 *   }
 *
 *   type Query {
 *     viewer: User
 *   }
 * `);
 * const newSchema = buildSchema(`
 *   type User {
 *     id: ID!
 *   }
 *
 *   type Query {
 *     viewer: User
 *   }
 * `);
 *
 * const changes = findBreakingChanges(oldSchema, newSchema);
 *
 * changes[0].type; // => 'FIELD_REMOVED'
 * changes[0].description; // matches /User.name was removed/
 * ```
 */
export declare function findBreakingChanges(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
): Array<BreakingChange>;
/**
 * Given two schemas, returns an Array containing descriptions of all the types
 * of potentially dangerous changes covered by the other functions down below.
 * @param oldSchema - Schema before the change.
 * @param newSchema - Schema after the change.
 * @returns Dangerous changes between the two schemas.
 * @example
 * ```ts
 * import { buildSchema, findDangerousChanges } from 'graphql/utilities';
 *
 * const oldSchema = buildSchema(`
 *   enum Episode {
 *     NEW_HOPE
 *   }
 *
 *   type Query {
 *     episode: Episode
 *   }
 * `);
 * const newSchema = buildSchema(`
 *   enum Episode {
 *     NEW_HOPE
 *     EMPIRE
 *   }
 *
 *   type Query {
 *     episode: Episode
 *   }
 * `);
 *
 * const changes = findDangerousChanges(oldSchema, newSchema);
 *
 * changes[0].type; // => 'VALUE_ADDED_TO_ENUM'
 * changes[0].description; // matches /EMPIRE was added/
 * ```
 */
export declare function findDangerousChanges(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
): Array<DangerousChange>;
