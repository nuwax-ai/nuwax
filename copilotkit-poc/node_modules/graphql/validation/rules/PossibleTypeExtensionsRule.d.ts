/** @category Validation Rules */
import type { ASTVisitor } from '../../language/visitor';
import type { SDLValidationContext } from '../ValidationContext';
/**
 * Possible type extension
 *
 * A type extension is only valid if the type is defined and has the same kind.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { PossibleTypeExtensionsRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   extend type Missing { name: String } type Query { name: String }
 * `;
 *
 * PossibleTypeExtensionsRule.name; // => 'PossibleTypeExtensionsRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   type Query { name: String } extend type Query { other: String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
export declare function PossibleTypeExtensionsRule(
  context: SDLValidationContext,
): ASTVisitor;
