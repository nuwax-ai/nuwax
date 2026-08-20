'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.GraphQLSpecifiedByDirective =
  exports.GraphQLSkipDirective =
  exports.GraphQLOneOfDirective =
  exports.GraphQLIncludeDirective =
  exports.GraphQLDirective =
  exports.GraphQLDeprecatedDirective =
  exports.DEFAULT_DEPRECATION_REASON =
    void 0;
exports.assertDirective = assertDirective;
exports.isDirective = isDirective;
exports.isSpecifiedDirective = isSpecifiedDirective;
exports.specifiedDirectives = void 0;

var _devAssert = require('../jsutils/devAssert.js');

var _inspect = require('../jsutils/inspect.js');

var _instanceOf = require('../jsutils/instanceOf.js');

var _isObjectLike = require('../jsutils/isObjectLike.js');

var _toObjMap = require('../jsutils/toObjMap.js');

var _directiveLocation = require('../language/directiveLocation.js');

var _assertName = require('./assertName.js');

var _definition = require('./definition.js');

var _scalars = require('./scalars.js');

/** @category Directives */

/**
 * Test if the given value is a GraphQL directive.
 * @param directive - Value to inspect.
 * @returns True when the value is a GraphQLDirective.
 * @example
 * ```ts
 * import { DirectiveLocation } from 'graphql/language';
 * import { GraphQLDirective, GraphQLString, isDirective } from 'graphql/type';
 *
 * const upper = new GraphQLDirective({
 *   name: 'upper',
 *   locations: [DirectiveLocation.FIELD_DEFINITION],
 * });
 *
 * isDirective(upper); // => true
 * isDirective(GraphQLString); // => false
 * ```
 */
function isDirective(directive) {
  return (0, _instanceOf.instanceOf)(directive, GraphQLDirective);
}
/**
 * Returns the value as a GraphQLDirective, or throws if it is not a directive.
 * @param directive - Value to inspect.
 * @returns The value typed as a GraphQLDirective.
 * @example
 * ```ts
 * import { DirectiveLocation } from 'graphql/language';
 * import { assertDirective, GraphQLDirective, GraphQLString } from 'graphql/type';
 *
 * const upper = new GraphQLDirective({
 *   name: 'upper',
 *   locations: [DirectiveLocation.FIELD_DEFINITION],
 * });
 *
 * assertDirective(upper); // => upper
 * assertDirective(GraphQLString); // throws an error
 * ```
 */

function assertDirective(directive) {
  if (!isDirective(directive)) {
    throw new Error(
      `Expected ${(0, _inspect.inspect)(directive)} to be a GraphQL directive.`,
    );
  }

  return directive;
}
/**
 * Custom extensions
 * @remarks
 * Use a unique identifier name for your extension, for example the name of
 * your library or project. Do not use a shortened identifier as this increases
 * the risk of conflicts. We recommend you add at most one extension field,
 * an object which can contain all the values you need.
 */

/**
 * Directives are used by the GraphQL runtime as a way of modifying execution
 * behavior. Type system creators will usually not create these directly.
 */
class GraphQLDirective {
  /** The GraphQL name for this schema element. */

  /** Human-readable description for this schema element, if provided. */

  /** Locations where this directive may be applied. */

  /** Arguments accepted by this field or directive. */

  /** Whether this directive may appear more than once at the same location. */

  /** Reason this element is deprecated, if one was provided. */

  /** Custom extension fields reserved for users. */

  /** AST node from which this schema element was built, if available. */

  /** AST extension nodes applied to this schema element. */

  /**
   * Creates a GraphQLDirective instance.
   * @param config - Configuration describing this object.
   * @example
   * ```ts
   * import { DirectiveLocation, parse } from 'graphql/language';
   * import {
   *   GraphQLBoolean,
   *   GraphQLDirective,
   *   GraphQLInt,
   *   GraphQLNonNull,
   * } from 'graphql/type';
   *
   * const document = parse(`
   *   directive @cacheControl(maxAge: Int) repeatable on FIELD_DEFINITION
   *   extend directive @cacheControl(maxAge: Int) on FIELD_DEFINITION
   * `);
   * const definition = document.definitions[0];
   *
   * const cacheControl = new GraphQLDirective({
   *   name: 'cacheControl',
   *   description: 'Controls HTTP cache hints for a field.',
   *   locations: [DirectiveLocation.FIELD_DEFINITION],
   *   args: {
   *     inheritMaxAge: {
   *       description: 'Inherit the parent cache hint.',
   *       type: new GraphQLNonNull(GraphQLBoolean),
   *       defaultValue: false,
   *       deprecationReason: 'Use maxAge instead.',
   *       extensions: { scope: 'cache' },
   *     },
   *     maxAge: {
   *       type: GraphQLInt,
   *       astNode: definition.arguments[0],
   *     },
   *   },
   *   isRepeatable: true,
   *   deprecationReason: 'Use @cache instead.',
   *   extensions: { scope: 'cache' },
   *   astNode: definition,
   *   extensionASTNodes: [ document.definitions[1] ],
   * });
   *
   * cacheControl.name; // => 'cacheControl'
   * cacheControl.description; // => 'Controls HTTP cache hints for a field.'
   * cacheControl.args[0].name; // => 'inheritMaxAge'
   * cacheControl.args[0].defaultValue; // => false
   * cacheControl.isRepeatable; // => true
   * cacheControl.extensions; // => { scope: 'cache' }
   * ```
   */
  constructor(config) {
    var _config$isRepeatable, _config$extensionASTN, _config$args;

    this.name = (0, _assertName.assertName)(config.name);
    this.description = config.description;
    this.locations = config.locations;
    this.isRepeatable =
      (_config$isRepeatable = config.isRepeatable) !== null &&
      _config$isRepeatable !== void 0
        ? _config$isRepeatable
        : false;
    this.deprecationReason = config.deprecationReason;
    this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes =
      (_config$extensionASTN = config.extensionASTNodes) !== null &&
      _config$extensionASTN !== void 0
        ? _config$extensionASTN
        : [];
    Array.isArray(config.locations) ||
      (0, _devAssert.devAssert)(
        false,
        `@${config.name} locations must be an Array.`,
      );
    const args =
      (_config$args = config.args) !== null && _config$args !== void 0
        ? _config$args
        : {};
    ((0, _isObjectLike.isObjectLike)(args) && !Array.isArray(args)) ||
      (0, _devAssert.devAssert)(
        false,
        `@${config.name} args must be an object with argument names as keys.`,
      );
    this.args = (0, _definition.defineArguments)(args);
  }
  /**
   * Returns the value used by `Object.prototype.toString`.
   * @returns The built-in string tag for this object.
   */

  get [Symbol.toStringTag]() {
    return 'GraphQLDirective';
  }
  /**
   * Returns a normalized configuration object for this object.
   * @returns A configuration object that can be used to recreate this object.
   * @example
   * ```ts
   * import { DirectiveLocation } from 'graphql/language';
   * import { GraphQLDirective, GraphQLString } from 'graphql/type';
   *
   * const tag = new GraphQLDirective({
   *   name: 'tag',
   *   locations: [DirectiveLocation.FIELD_DEFINITION],
   *   args: {
   *     name: { type: GraphQLString },
   *   },
   * });
   *
   * const config = tag.toConfig();
   * const tagCopy = new GraphQLDirective(config);
   *
   * config.args.name.type; // => GraphQLString
   * tagCopy.args[0].name; // => 'name'
   * ```
   */

  toConfig() {
    return {
      name: this.name,
      description: this.description,
      locations: this.locations,
      args: (0, _definition.argsToArgsConfig)(this.args),
      isRepeatable: this.isRepeatable,
      deprecationReason: this.deprecationReason,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes,
    };
  }
  /**
   * Returns the schema coordinate identifying this directive.
   * @returns The directive schema coordinate.
   * @example
   * ```ts
   * import { DirectiveLocation } from 'graphql/language';
   * import { GraphQLDirective } from 'graphql/type';
   *
   * const tag = new GraphQLDirective({
   *   name: 'tag',
   *   locations: [DirectiveLocation.FIELD_DEFINITION],
   * });
   *
   * tag.toString(); // => '@tag'
   * ```
   */

  toString() {
    return '@' + this.name;
  }
  /**
   * Returns the JSON representation used when this object is serialized.
   * @returns The JSON-serializable representation.
   * @example
   * ```ts
   * import { DirectiveLocation } from 'graphql/language';
   * import { GraphQLDirective } from 'graphql/type';
   *
   * const tag = new GraphQLDirective({
   *   name: 'tag',
   *   locations: [DirectiveLocation.FIELD_DEFINITION],
   * });
   *
   * tag.toJSON(); // => '@tag'
   * JSON.stringify({ directive: tag }); // => '{"directive":"@tag"}'
   * ```
   */

  toJSON() {
    return this.toString();
  }
}
/** Configuration used to construct a GraphQLDirective. */

exports.GraphQLDirective = GraphQLDirective;

/** Used to conditionally include fields or fragments. */
const GraphQLIncludeDirective = new GraphQLDirective({
  name: 'include',
  description:
    'Directs the executor to include this field or fragment only when the `if` argument is true.',
  locations: [
    _directiveLocation.DirectiveLocation.FIELD,
    _directiveLocation.DirectiveLocation.FRAGMENT_SPREAD,
    _directiveLocation.DirectiveLocation.INLINE_FRAGMENT,
  ],
  args: {
    if: {
      type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
      description: 'Included when true.',
    },
  },
});
/** Used to conditionally skip (exclude) fields or fragments. */

exports.GraphQLIncludeDirective = GraphQLIncludeDirective;
const GraphQLSkipDirective = new GraphQLDirective({
  name: 'skip',
  description:
    'Directs the executor to skip this field or fragment when the `if` argument is true.',
  locations: [
    _directiveLocation.DirectiveLocation.FIELD,
    _directiveLocation.DirectiveLocation.FRAGMENT_SPREAD,
    _directiveLocation.DirectiveLocation.INLINE_FRAGMENT,
  ],
  args: {
    if: {
      type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
      description: 'Skipped when true.',
    },
  },
});
/** Constant string used for default reason for a deprecation. */

exports.GraphQLSkipDirective = GraphQLSkipDirective;
const DEFAULT_DEPRECATION_REASON = 'No longer supported';
/**
 * Used to declare element of a GraphQL schema as deprecated.
 *
 * The optional `reason` argument defaults to `DEFAULT_DEPRECATION_REASON`.
 */

exports.DEFAULT_DEPRECATION_REASON = DEFAULT_DEPRECATION_REASON;
const GraphQLDeprecatedDirective = new GraphQLDirective({
  name: 'deprecated',
  description: 'Marks an element of a GraphQL schema as no longer supported.',
  locations: [
    _directiveLocation.DirectiveLocation.FIELD_DEFINITION,
    _directiveLocation.DirectiveLocation.ARGUMENT_DEFINITION,
    _directiveLocation.DirectiveLocation.INPUT_FIELD_DEFINITION,
    _directiveLocation.DirectiveLocation.ENUM_VALUE,
    _directiveLocation.DirectiveLocation.DIRECTIVE_DEFINITION,
  ],
  args: {
    reason: {
      type: _scalars.GraphQLString,
      description:
        'Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).',
      defaultValue: DEFAULT_DEPRECATION_REASON,
    },
  },
});
/** Used to provide a URL for specifying the behavior of custom scalar definitions. */

exports.GraphQLDeprecatedDirective = GraphQLDeprecatedDirective;
const GraphQLSpecifiedByDirective = new GraphQLDirective({
  name: 'specifiedBy',
  description: 'Exposes a URL that specifies the behavior of this scalar.',
  locations: [_directiveLocation.DirectiveLocation.SCALAR],
  args: {
    url: {
      type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
      description: 'The URL that specifies the behavior of this scalar.',
    },
  },
});
/** Used to indicate an Input Object is a OneOf Input Object. */

exports.GraphQLSpecifiedByDirective = GraphQLSpecifiedByDirective;
const GraphQLOneOfDirective = new GraphQLDirective({
  name: 'oneOf',
  description:
    'Indicates exactly one field must be supplied and this field must not be `null`.',
  locations: [_directiveLocation.DirectiveLocation.INPUT_OBJECT],
  args: {},
});
/** Full list of stable directives specified by GraphQL.js. */

exports.GraphQLOneOfDirective = GraphQLOneOfDirective;
const specifiedDirectives = Object.freeze([
  GraphQLIncludeDirective,
  GraphQLSkipDirective,
  GraphQLDeprecatedDirective,
  GraphQLSpecifiedByDirective,
  GraphQLOneOfDirective,
]);
/**
 * Returns true when the directive is one of the directives specified by GraphQL.
 * @param directive - Directive to inspect.
 * @returns True when the directive is specified by GraphQL.
 * @example
 * ```ts
 * import {
 *   GraphQLDirective,
 *   GraphQLIncludeDirective,
 *   isSpecifiedDirective,
 * } from 'graphql/type';
 * import { DirectiveLocation } from 'graphql/language';
 *
 * const customDirective = new GraphQLDirective({
 *   name: 'auth',
 *   locations: [DirectiveLocation.FIELD_DEFINITION],
 * });
 *
 * isSpecifiedDirective(GraphQLIncludeDirective); // => true
 * isSpecifiedDirective(customDirective); // => false
 * ```
 */

exports.specifiedDirectives = specifiedDirectives;

function isSpecifiedDirective(directive) {
  return specifiedDirectives.some(({ name }) => name === directive.name);
}
