/** @category Errors */
import type { Maybe } from '../jsutils/Maybe';
import type { ASTNode } from '../language/ast';
import { GraphQLError } from './GraphQLError';
/**
 * Given an arbitrary value, presumably thrown while attempting to execute a
 * GraphQL operation, produce a new GraphQLError aware of the location in the
 * document responsible for the original Error.
 * @param rawOriginalError - The original error value to wrap.
 * @param nodes - The AST nodes associated with the error.
 * @param path - The response path associated with the error.
 * @returns The GraphQL error.
 * @example
 * ```ts
 * import { parse } from 'graphql/language';
 * import { locatedError } from 'graphql/error';
 *
 * const document = parse('{ viewer { name } }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 * const error = locatedError(new Error('Resolver failed'), fieldNode, [
 *   'viewer',
 * ]);
 *
 * error.message; // => 'Resolver failed'
 * error.locations; // => [{ line: 1, column: 3 }]
 * error.path; // => ['viewer']
 * ```
 */
export declare function locatedError(
  rawOriginalError: unknown,
  nodes: ASTNode | ReadonlyArray<ASTNode> | undefined | null,
  path?: Maybe<ReadonlyArray<string | number>>,
): GraphQLError;
