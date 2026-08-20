/** @category Validation Rules */
import type { ASTVisitor } from '../../language/visitor';
import type { SDLValidationContext } from '../ValidationContext';
/**
 * Unique enum value names
 *
 * A GraphQL enum type is only valid if all its values are uniquely named.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueEnumValueNamesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   enum Status { ACTIVE ACTIVE } type Query { status: Status }
 * `;
 *
 * UniqueEnumValueNamesRule.name; // => 'UniqueEnumValueNamesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   enum Status { ACTIVE INACTIVE } type Query { status: Status }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
export declare function UniqueEnumValueNamesRule(
  context: SDLValidationContext,
): ASTVisitor;
