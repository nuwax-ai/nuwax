'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.Token =
  exports.QueryDocumentKeys =
  exports.OperationTypeNode =
  exports.Location =
    void 0;
exports.isNode = isNode;

/** @category AST */

/**
 * Contains a range of UTF-8 character offsets and token references that
 * identify the region of the source from which the AST derived.
 */
class Location {
  /** The character offset at which this Node begins. */

  /** The character offset at which this Node ends. */

  /** The Token at which this Node begins. */

  /** The Token at which this Node ends. */

  /** The Source document the AST represents. */

  /**
   * Creates a Location instance.
   * @param startToken - The start token.
   * @param endToken - The end token.
   * @param source - Source document used to derive error locations.
   * @example
   * ```ts
   * import { Location, Source, Token, TokenKind } from 'graphql/language';
   *
   * const source = new Source('{ hello }');
   * const startToken = new Token(TokenKind.BRACE_L, 0, 1, 1, 1);
   * const endToken = new Token(TokenKind.BRACE_R, 8, 9, 1, 9);
   * const location = new Location(startToken, endToken, source);
   *
   * location.start; // => 0
   * location.end; // => 9
   * location.source.body; // => '{ hello }'
   * ```
   */
  constructor(startToken, endToken, source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  }
  /**
   * Returns the value used by `Object.prototype.toString`.
   * @returns The built-in string tag for this object.
   */

  get [Symbol.toStringTag]() {
    return 'Location';
  }
  /**
   * Returns a JSON representation of this location.
   * @returns The JSON-serializable representation.
   * @example
   * ```ts
   * import { parse } from 'graphql/language';
   *
   * const document = parse('{ hello }');
   * const location = document.loc?.toJSON();
   *
   * location; // => { start: 0, end: 9 }
   * ```
   */

  toJSON() {
    return {
      start: this.start,
      end: this.end,
    };
  }
}
/**
 * Represents a range of characters represented by a lexical token
 * within a Source.
 */

exports.Location = Location;

class Token {
  /** The kind of Token. */

  /** The character offset at which this Node begins. */

  /** The character offset at which this Node ends. */

  /** The 1-indexed line number on which this Token appears. */

  /** The 1-indexed column number at which this Token begins. */

  /**
   * For non-punctuation tokens, represents the interpreted value of the token.
   *
   * Note: is undefined for punctuation tokens, but typed as string for
   * convenience in the parser.
   */

  /**
   * Tokens exist as nodes in a double-linked-list amongst all tokens
   * including ignored tokens. <SOF> is always the first node and <EOF>
   * the last.
   */

  /** Next token in the token stream, including ignored tokens. */

  /**
   * Creates a Token instance.
   * @param kind - Token kind produced by lexical analysis.
   * @param start - Character offset where this token begins.
   * @param end - Character offset where this token ends.
   * @param line - One-indexed line number where this token begins.
   * @param column - One-indexed column number where this token begins.
   * @param value - Interpreted value for non-punctuation tokens.
   * @example
   * ```ts
   * import { Token, TokenKind } from 'graphql/language';
   *
   * const token = new Token(TokenKind.NAME, 2, 7, 1, 3, 'hello');
   *
   * token.kind; // => TokenKind.NAME
   * token.value; // => 'hello'
   * token.toJSON(); // => { kind: 'Name', value: 'hello', line: 1, column: 3 }
   * ```
   */
  constructor(kind, start, end, line, column, value) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column; // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

    this.value = value;
    this.prev = null;
    this.next = null;
  }
  /**
   * Returns the value used by `Object.prototype.toString`.
   * @returns The built-in string tag for this object.
   */

  get [Symbol.toStringTag]() {
    return 'Token';
  }
  /**
   * Returns a JSON representation of this token.
   * @returns The JSON-serializable representation.
   * @example
   * ```ts
   * import { Lexer, Source } from 'graphql/language';
   *
   * const lexer = new Lexer(new Source('{ hello }'));
   * const token = lexer.advance().toJSON();
   *
   * token; // => { kind: '{', value: undefined, line: 1, column: 1 }
   * ```
   */

  toJSON() {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column,
    };
  }
}
/** The list of all possible AST node types. */

exports.Token = Token;

/** @internal */
const QueryDocumentKeys = {
  Name: [],
  Document: ['definitions'],
  OperationDefinition: [
    'description',
    'name',
    'variableDefinitions',
    'directives',
    'selectionSet',
  ],
  VariableDefinition: [
    'description',
    'variable',
    'type',
    'defaultValue',
    'directives',
  ],
  Variable: ['name'],
  SelectionSet: ['selections'],
  Field: ['alias', 'name', 'arguments', 'directives', 'selectionSet'],
  Argument: ['name', 'value'],
  FragmentSpread: ['name', 'directives'],
  InlineFragment: ['typeCondition', 'directives', 'selectionSet'],
  FragmentDefinition: [
    'description',
    'name', // Note: fragment variable definitions are deprecated and will removed in v17.0.0
    'variableDefinitions',
    'typeCondition',
    'directives',
    'selectionSet',
  ],
  IntValue: [],
  FloatValue: [],
  StringValue: [],
  BooleanValue: [],
  NullValue: [],
  EnumValue: [],
  ListValue: ['values'],
  ObjectValue: ['fields'],
  ObjectField: ['name', 'value'],
  Directive: ['name', 'arguments'],
  NamedType: ['name'],
  ListType: ['type'],
  NonNullType: ['type'],
  SchemaDefinition: ['description', 'directives', 'operationTypes'],
  OperationTypeDefinition: ['type'],
  ScalarTypeDefinition: ['description', 'name', 'directives'],
  ObjectTypeDefinition: [
    'description',
    'name',
    'interfaces',
    'directives',
    'fields',
  ],
  FieldDefinition: ['description', 'name', 'arguments', 'type', 'directives'],
  InputValueDefinition: [
    'description',
    'name',
    'type',
    'defaultValue',
    'directives',
  ],
  InterfaceTypeDefinition: [
    'description',
    'name',
    'interfaces',
    'directives',
    'fields',
  ],
  UnionTypeDefinition: ['description', 'name', 'directives', 'types'],
  EnumTypeDefinition: ['description', 'name', 'directives', 'values'],
  EnumValueDefinition: ['description', 'name', 'directives'],
  InputObjectTypeDefinition: ['description', 'name', 'directives', 'fields'],
  DirectiveDefinition: [
    'description',
    'name',
    'arguments',
    'directives',
    'locations',
  ],
  SchemaExtension: ['directives', 'operationTypes'],
  DirectiveExtension: ['name', 'directives'],
  ScalarTypeExtension: ['name', 'directives'],
  ObjectTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
  InterfaceTypeExtension: ['name', 'interfaces', 'directives', 'fields'],
  UnionTypeExtension: ['name', 'directives', 'types'],
  EnumTypeExtension: ['name', 'directives', 'values'],
  InputObjectTypeExtension: ['name', 'directives', 'fields'],
  TypeCoordinate: ['name'],
  MemberCoordinate: ['name', 'memberName'],
  ArgumentCoordinate: ['name', 'fieldName', 'argumentName'],
  DirectiveCoordinate: ['name'],
  DirectiveArgumentCoordinate: ['name', 'argumentName'],
};
exports.QueryDocumentKeys = QueryDocumentKeys;
const kindValues = new Set(Object.keys(QueryDocumentKeys));
/** @internal */

function isNode(maybeNode) {
  const maybeKind =
    maybeNode === null || maybeNode === void 0 ? void 0 : maybeNode.kind;
  return typeof maybeKind === 'string' && kindValues.has(maybeKind);
}
/** An identifier in a GraphQL document. */

/**
 * The operation types supported by GraphQL executable definitions.
 * @category Kinds
 */
var OperationTypeNode;
exports.OperationTypeNode = OperationTypeNode;

(function (OperationTypeNode) {
  OperationTypeNode['QUERY'] = 'query';
  OperationTypeNode['MUTATION'] = 'mutation';
  OperationTypeNode['SUBSCRIPTION'] = 'subscription';
})(OperationTypeNode || (exports.OperationTypeNode = OperationTypeNode = {}));
/** A variable declaration in an operation or legacy fragment definition. */
