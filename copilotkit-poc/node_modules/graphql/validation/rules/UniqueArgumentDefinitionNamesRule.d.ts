/** @category Validation Rules */
import type { ASTVisitor } from '../../language/visitor';
import type { SDLValidationContext } from '../ValidationContext';
/**
 * Unique argument definition names
 *
 * A GraphQL Object or Interface type is only valid if all its fields have uniquely named arguments.
 * A GraphQL Directive is only valid if all its arguments are uniquely named.
 * @param context - The validation context used while checking the document.
 * @returns A visitor that reports validation errors for this rule.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql';
 * import { UniqueArgumentDefinitionNamesRule } from 'graphql/validation';
 *
 * const invalidSDL = `
 *   type Query { field(arg: String, arg: Int): String }
 * `;
 *
 * UniqueArgumentDefinitionNamesRule.name; // => 'UniqueArgumentDefinitionNamesRule'
 * buildSchema(invalidSDL); // throws an error
 *
 * const validSDL = `
 *   type Query { field(arg: String): String }
 * `;
 *
 * buildSchema(validSDL); // does not throw
 * ```
 */
export declare function UniqueArgumentDefinitionNamesRule(
  context: SDLValidationContext,
): ASTVisitor;
