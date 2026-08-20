/** @category Validation Rules */
import type { ASTVisitor } from '../../language/visitor';
import type { SDLValidationContext } from '../ValidationContext';
/**
 * Unique operation types
 *
 * A GraphQL document is only valid if it has only one type per operation.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueOperationTypesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   schema { query: Query query: Other } type Query { name: String } type Other { name: String }
 * `;
 *
 * UniqueOperationTypesRule.name; // => 'UniqueOperationTypesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   schema { query: Query } type Query { name: String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
export declare function UniqueOperationTypesRule(
  context: SDLValidationContext,
): ASTVisitor;
