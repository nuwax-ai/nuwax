/** @category Validation Rules */
import type { ASTVisitor } from '../../language/visitor';
import type { SDLValidationContext } from '../ValidationContext';
/**
 * Unique field definition names
 *
 * A GraphQL complex type is only valid if all its fields are uniquely named.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueFieldDefinitionNamesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   type Query { name: String name: String }
 * `;
 *
 * UniqueFieldDefinitionNamesRule.name; // => 'UniqueFieldDefinitionNamesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   type Query { name: String other: String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
export declare function UniqueFieldDefinitionNamesRule(
  context: SDLValidationContext,
): ASTVisitor;
