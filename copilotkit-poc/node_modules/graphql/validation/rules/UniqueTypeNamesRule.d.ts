/** @category Validation Rules */
import type { ASTVisitor } from '../../language/visitor';
import type { SDLValidationContext } from '../ValidationContext';
/**
 * Unique type names
 *
 * A GraphQL document is only valid if all defined types have unique names.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueTypeNamesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   type Query { name: String } type Query { other: String }
 * `;
 *
 * UniqueTypeNamesRule.name; // => 'UniqueTypeNamesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   type Query { name: String } type Other { name: String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
export declare function UniqueTypeNamesRule(
  context: SDLValidationContext,
): ASTVisitor;
