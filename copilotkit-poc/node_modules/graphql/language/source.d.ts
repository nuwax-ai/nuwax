/** @category Source */
interface Location {
  line: number;
  column: number;
}
/**
 * A representation of source input to GraphQL. The `name` and `locationOffset` parameters are
 * optional, but they are useful for clients who store GraphQL documents in source files.
 * For example, if the GraphQL input starts at line 40 in a file named `Foo.graphql`, it might
 * be useful for `name` to be `"Foo.graphql"` and location to be `{ line: 40, column: 1 }`.
 * The `line` and `column` properties in `locationOffset` are 1-indexed.
 */
export declare class Source {
  /** The GraphQL source text. */
  body: string;
  /** Name used in diagnostics for this source, such as a file path or request name. */
  name: string;
  /** One-indexed line and column where this source begins. */
  locationOffset: Location;
  /**
   * Creates a Source instance.
   * @param body - The GraphQL source text.
   * @param name - Name used in diagnostics for this source.
   * @param locationOffset - One-indexed line and column where this source begins.
   * @example
   * ```ts
   * import { Source } from 'graphql/language';
   *
   * const source = new Source(
   *   'type Query { greeting: String }',
   *   'schema.graphql',
   *   { line: 10, column: 1 },
   * );
   *
   * source.body; // => 'type Query { greeting: String }'
   * source.name; // => 'schema.graphql'
   * source.locationOffset; // => { line: 10, column: 1 }
   * ```
   */
  constructor(body: string, name?: string, locationOffset?: Location);
  /**
   * Returns the value used by `Object.prototype.toString`.
   * @returns The built-in string tag for this object.
   */
  get [Symbol.toStringTag](): string;
}
/**
 * Test if the given value is a Source object.
 *
 * @internal
 */
export declare function isSource(source: unknown): source is Source;
export {};
