'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.GraphQLSchema = void 0;
exports.assertSchema = assertSchema;
exports.isSchema = isSchema;

var _devAssert = require('../jsutils/devAssert.js');

var _inspect = require('../jsutils/inspect.js');

var _instanceOf = require('../jsutils/instanceOf.js');

var _isObjectLike = require('../jsutils/isObjectLike.js');

var _toObjMap = require('../jsutils/toObjMap.js');

var _ast = require('../language/ast.js');

var _definition = require('./definition.js');

var _directives = require('./directives.js');

var _introspection = require('./introspection.js');

/** @category Schema */

/**
 * Test if the given value is a GraphQL schema.
 * @param schema - Value to inspect.
 * @returns True when the value is a GraphQLSchema.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql/utilities';
 * import { GraphQLString, isSchema } from 'graphql/type';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 *
 * isSchema(schema); // => true
 * isSchema(GraphQLString); // => false
 * ```
 */
function isSchema(schema) {
  return (0, _instanceOf.instanceOf)(schema, GraphQLSchema);
}
/**
 * Returns the value as a GraphQLSchema, or throws if it is not a schema.
 * @param schema - GraphQL schema to use.
 * @returns The value typed as a GraphQLSchema.
 * @example
 * ```ts
 * import { buildSchema } from 'graphql/utilities';
 * import { assertSchema, GraphQLString } from 'graphql/type';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     greeting: String
 *   }
 * `);
 *
 * assertSchema(schema); // => schema
 * assertSchema(GraphQLString); // throws an error
 * ```
 */

function assertSchema(schema) {
  if (!isSchema(schema)) {
    throw new Error(
      `Expected ${(0, _inspect.inspect)(schema)} to be a GraphQL schema.`,
    );
  }

  return schema;
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
 * Schema Definition
 *
 * A Schema is created by supplying the root types of each type of operation,
 * query and mutation (optional). A schema definition is then supplied to the
 * validator and executor.
 * @example
 * ```ts
 * const MyAppQueryRootType = new GraphQLObjectType({
 *   name: 'Query',
 *   fields: {
 *     greeting: { type: GraphQLString },
 *   },
 * });
 *
 * const MyAppMutationRootType = new GraphQLObjectType({
 *   name: 'Mutation',
 *   fields: {
 *     setGreeting: { type: GraphQLString },
 *   },
 * });
 *
 * const MyAppSchema = new GraphQLSchema({
 *   query: MyAppQueryRootType,
 *   mutation: MyAppMutationRootType,
 * });
 * ```
 * @example
 * When the schema is constructed, by default only the types that are reachable
 * by traversing the root types are included, other types must be explicitly
 * referenced.
 *
 * ```ts
 * const characterInterface = new GraphQLInterfaceType({
 *   name: 'Character',
 *   fields: {
 *     name: { type: GraphQLString },
 *   },
 * });
 *
 * const humanType = new GraphQLObjectType({
 *   name: 'Human',
 *   interfaces: [characterInterface],
 *   fields: {
 *     name: { type: GraphQLString },
 *   },
 * });
 *
 * const droidType = new GraphQLObjectType({
 *   name: 'Droid',
 *   interfaces: [characterInterface],
 *   fields: {
 *     name: { type: GraphQLString },
 *   },
 * });
 *
 * const schema = new GraphQLSchema({
 *   query: new GraphQLObjectType({
 *     name: 'Query',
 *     fields: {
 *       hero: { type: characterInterface },
 *     },
 *   }),
 *   // Since this schema references only the `Character` interface it's
 *   // necessary to explicitly list the types that implement it if
 *   // you want them to be included in the final schema.
 *   types: [humanType, droidType],
 * });
 * ```
 * @example
 * If an array of `directives` are provided to GraphQLSchema, that will be the
 * exact list of directives represented and allowed. If `directives` is not
 * provided then a default set of the specified directives (e.g. `@include` and
 * `@skip`) will be used. If you wish to provide *additional* directives to
 * these specified directives, you must explicitly declare them.
 *
 * ```ts
 * const MyAppSchema = new GraphQLSchema({
 *   query: MyAppQueryRootType,
 *   directives: specifiedDirectives.concat([myCustomDirective]),
 * });
 * ```
 */
class GraphQLSchema {
  /** Human-readable description for this schema element, if provided. */

  /** Custom extension fields reserved for users. */

  /** AST node from which this schema element was built, if available. */

  /** AST extension nodes applied to this schema element. */

  /**
   * Cached schema validation errors, if validation has already run.
   * @internal
   */

  /**
   * Creates a GraphQLSchema instance.
   * @param config - Configuration describing this object.
   * @example
   * ```ts
   * // Create a schema with the required query root.
   * import {
   *   GraphQLObjectType,
   *   GraphQLSchema,
   *   GraphQLString,
   * } from 'graphql/type';
   *
   * const Query = new GraphQLObjectType({
   *   name: 'Query',
   *   fields: {
   *     greeting: {
   *       type: GraphQLString,
   *       resolve: () => 'Hello',
   *     },
   *   },
   * });
   *
   * const schema = new GraphQLSchema({
   *   description: 'The application schema.',
   *   query: Query,
   * });
   *
   * schema.getQueryType(); // => Query
   * schema.description; // => 'The application schema.'
   * ```
   * @example
   * ```ts
   * // This variant configures every schema option, including directives and extensions.
   * import { DirectiveLocation, parse } from 'graphql/language';
   * import {
   *   GraphQLBoolean,
   *   GraphQLDirective,
   *   GraphQLObjectType,
   *   GraphQLSchema,
   *   GraphQLString,
   * } from 'graphql/type';
   *
   * const Query = new GraphQLObjectType({
   *   name: 'Query',
   *   fields: { greeting: { type: GraphQLString } },
   * });
   * const Mutation = new GraphQLObjectType({
   *   name: 'Mutation',
   *   fields: { setGreeting: { type: GraphQLString } },
   * });
   * const Subscription = new GraphQLObjectType({
   *   name: 'Subscription',
   *   fields: { greetingChanged: { type: GraphQLString } },
   * });
   * const AuditEvent = new GraphQLObjectType({
   *   name: 'AuditEvent',
   *   fields: { message: { type: GraphQLString } },
   * });
   * const authDirective = new GraphQLDirective({
   *   name: 'auth',
   *   locations: [DirectiveLocation.FIELD_DEFINITION],
   *   args: { required: { type: GraphQLBoolean } },
   * });
   * const schemaDocument = parse(`
   *   schema {
   *     query: Query
   *     mutation: Mutation
   *     subscription: Subscription
   *   }
   *
   *   extend schema @auth
   * `);
   *
   * const schema = new GraphQLSchema({
   *   description: 'Operations exposed by the application.',
   *   query: Query,
   *   mutation: Mutation,
   *   subscription: Subscription,
   *   types: [AuditEvent],
   *   directives: [authDirective],
   *   extensions: { owner: 'platform' },
   *   astNode: schemaDocument.definitions[0],
   *   extensionASTNodes: [ schemaDocument.definitions[1] ],
   *   assumeValid: true,
   * });
   *
   * schema.getMutationType(); // => Mutation
   * schema.getSubscriptionType(); // => Subscription
   * schema.getType('AuditEvent'); // => AuditEvent
   * schema.getDirective('auth'); // => authDirective
   * schema.extensions; // => { owner: 'platform' }
   * ```
   */
  constructor(config) {
    var _config$extensionASTN, _config$directives;

    // If this schema was built from a source known to be valid, then it may be
    // marked with assumeValid to avoid an additional type system validation.
    this.__validationErrors = config.assumeValid === true ? [] : undefined; // Check for common mistakes during construction to produce early errors.

    (0, _isObjectLike.isObjectLike)(config) ||
      (0, _devAssert.devAssert)(false, 'Must provide configuration object.');
    !config.types ||
      Array.isArray(config.types) ||
      (0, _devAssert.devAssert)(
        false,
        `"types" must be Array if provided but got: ${(0, _inspect.inspect)(
          config.types,
        )}.`,
      );
    !config.directives ||
      Array.isArray(config.directives) ||
      (0, _devAssert.devAssert)(
        false,
        '"directives" must be Array if provided but got: ' +
          `${(0, _inspect.inspect)(config.directives)}.`,
      );
    this.description = config.description;
    this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes =
      (_config$extensionASTN = config.extensionASTNodes) !== null &&
      _config$extensionASTN !== void 0
        ? _config$extensionASTN
        : [];
    this._queryType = config.query;
    this._mutationType = config.mutation;
    this._subscriptionType = config.subscription; // Provide specified directives (e.g. @include and @skip) by default.

    this._directives =
      (_config$directives = config.directives) !== null &&
      _config$directives !== void 0
        ? _config$directives
        : _directives.specifiedDirectives; // To preserve order of user-provided types, we add first to add them to
    // the set of "collected" types, so `collectReferencedTypes` ignore them.

    const allReferencedTypes = new Set(config.types);

    if (config.types != null) {
      for (const type of config.types) {
        // When we ready to process this type, we remove it from "collected" types
        // and then add it together with all dependent types in the correct position.
        allReferencedTypes.delete(type);
        collectReferencedTypes(type, allReferencedTypes);
      }
    }

    if (this._queryType != null) {
      collectReferencedTypes(this._queryType, allReferencedTypes);
    }

    if (this._mutationType != null) {
      collectReferencedTypes(this._mutationType, allReferencedTypes);
    }

    if (this._subscriptionType != null) {
      collectReferencedTypes(this._subscriptionType, allReferencedTypes);
    }

    for (const directive of this._directives) {
      // Directives are not validated until validateSchema() is called.
      if ((0, _directives.isDirective)(directive)) {
        for (const arg of directive.args) {
          collectReferencedTypes(arg.type, allReferencedTypes);
        }
      }
    }

    collectReferencedTypes(_introspection.__Schema, allReferencedTypes); // Storing the resulting map for reference by the schema.

    this._typeMap = Object.create(null);
    this._subTypeMap = Object.create(null); // Keep track of all implementations by interface name.

    this._implementationsMap = Object.create(null);

    for (const namedType of allReferencedTypes) {
      if (namedType == null) {
        continue;
      }

      const typeName = namedType.name;
      typeName ||
        (0, _devAssert.devAssert)(
          false,
          'One of the provided types for building the Schema is missing a name.',
        );

      if (this._typeMap[typeName] !== undefined) {
        throw new Error(
          `Schema must contain uniquely named types but contains multiple types named "${typeName}".`,
        );
      }

      this._typeMap[typeName] = namedType;

      if ((0, _definition.isInterfaceType)(namedType)) {
        // Store implementations by interface.
        for (const iface of namedType.getInterfaces()) {
          if ((0, _definition.isInterfaceType)(iface)) {
            let implementations = this._implementationsMap[iface.name];

            if (implementations === undefined) {
              implementations = this._implementationsMap[iface.name] = {
                objects: [],
                interfaces: [],
              };
            }

            implementations.interfaces.push(namedType);
          }
        }
      } else if ((0, _definition.isObjectType)(namedType)) {
        // Store implementations by objects.
        for (const iface of namedType.getInterfaces()) {
          if ((0, _definition.isInterfaceType)(iface)) {
            let implementations = this._implementationsMap[iface.name];

            if (implementations === undefined) {
              implementations = this._implementationsMap[iface.name] = {
                objects: [],
                interfaces: [],
              };
            }

            implementations.objects.push(namedType);
          }
        }
      }
    }
  }
  /**
   * Returns the value used by `Object.prototype.toString`.
   * @returns The built-in string tag for this object.
   */

  get [Symbol.toStringTag]() {
    return 'GraphQLSchema';
  }
  /**
   * Returns the root object type for query operations.
   * @returns The query root type, if this schema defines one.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   *
   * schema.getQueryType()?.name; // => 'Query'
   * ```
   */

  getQueryType() {
    return this._queryType;
  }
  /**
   * Returns the root object type for mutation operations.
   * @returns The mutation root type, if this schema defines one.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   *
   *   type Mutation {
   *     setGreeting(value: String!): String
   *   }
   * `);
   *
   * schema.getMutationType()?.name; // => 'Mutation'
   * ```
   */

  getMutationType() {
    return this._mutationType;
  }
  /**
   * Returns the root object type for subscription operations.
   * @returns The subscription root type, if this schema defines one.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   *
   *   type Subscription {
   *     greetings: String
   *   }
   * `);
   *
   * schema.getSubscriptionType()?.name; // => 'Subscription'
   * ```
   */

  getSubscriptionType() {
    return this._subscriptionType;
  }
  /**
   * Returns the root object type for the requested operation kind.
   * @param operation - Operation kind to resolve.
   * @returns The root object type for the operation kind, if this schema defines one.
   * @example
   * ```ts
   * import { OperationTypeNode } from 'graphql/language';
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   *
   *   type Mutation {
   *     setGreeting(value: String!): String
   *   }
   * `);
   *
   * schema.getRootType(OperationTypeNode.QUERY)?.name; // => 'Query'
   * schema.getRootType(OperationTypeNode.MUTATION)?.name; // => 'Mutation'
   * schema.getRootType(OperationTypeNode.SUBSCRIPTION); // => undefined
   * ```
   */

  getRootType(operation) {
    switch (operation) {
      case _ast.OperationTypeNode.QUERY:
        return this.getQueryType();

      case _ast.OperationTypeNode.MUTATION:
        return this.getMutationType();

      case _ast.OperationTypeNode.SUBSCRIPTION:
        return this.getSubscriptionType();
    }
  }
  /**
   * Returns all named types known to this schema.
   * @returns A map of schema types keyed by type name.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   type User {
   *     name: String
   *   }
   *
   *   type Query {
   *     viewer: User
   *   }
   * `);
   *
   * const typeMap = schema.getTypeMap();
   *
   * typeMap.User.name; // => 'User'
   * typeMap.Query.name; // => 'Query'
   * typeMap.String.name; // => 'String'
   * ```
   */

  getTypeMap() {
    return this._typeMap;
  }
  /**
   * Returns the named type with the provided name.
   * @param name - The GraphQL name to look up.
   * @returns The named schema type, if one exists.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   type User {
   *     name: String
   *   }
   *
   *   type Query {
   *     viewer: User
   *   }
   * `);
   *
   * schema.getType('User')?.toString(); // => 'User'
   * schema.getType('Missing'); // => undefined
   * ```
   */

  getType(name) {
    return this.getTypeMap()[name];
  }
  /**
   * Returns object types that may be returned for an abstract type.
   * @param abstractType - Interface or union type to inspect.
   * @returns Object types that may satisfy the abstract type.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   * import { assertInterfaceType, assertUnionType } from 'graphql/type';
   *
   * const schema = buildSchema(`
   *   interface Node {
   *     id: ID!
   *   }
   *
   *   type User implements Node {
   *     id: ID!
   *   }
   *
   *   type Organization implements Node {
   *     id: ID!
   *   }
   *
   *   union SearchResult = User | Organization
   *
   *   type Query {
   *     node: Node
   *     search: [SearchResult]
   *   }
   * `);
   *
   * const Node = assertInterfaceType(schema.getType('Node'));
   * const SearchResult = assertUnionType(schema.getType('SearchResult'));
   *
   * schema.getPossibleTypes(Node).map((type) => type.name); // => ['User', 'Organization']
   * schema.getPossibleTypes(SearchResult).map((type) => type.name); // => ['User', 'Organization']
   * ```
   */

  getPossibleTypes(abstractType) {
    return (0, _definition.isUnionType)(abstractType)
      ? abstractType.getTypes()
      : this.getImplementations(abstractType).objects;
  }
  /**
   * Returns objects and interfaces that implement an interface type.
   * @param interfaceType - Interface type to inspect.
   * @returns Object and interface implementations of the interface.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   * import { assertInterfaceType } from 'graphql/type';
   *
   * const schema = buildSchema(`
   *   interface Resource {
   *     url: String!
   *   }
   *
   *   interface Image implements Resource {
   *     url: String!
   *     width: Int
   *   }
   *
   *   type Photo implements Resource & Image {
   *     url: String!
   *     width: Int
   *   }
   *
   *   type Query {
   *     resource: Resource
   *   }
   * `);
   *
   * const Resource = assertInterfaceType(schema.getType('Resource'));
   * const implementations = schema.getImplementations(Resource);
   *
   * implementations.interfaces.map((type) => type.name); // => ['Image']
   * implementations.objects.map((type) => type.name); // => ['Photo']
   * ```
   */

  getImplementations(interfaceType) {
    const implementations = this._implementationsMap[interfaceType.name];
    return implementations !== null && implementations !== void 0
      ? implementations
      : {
          objects: [],
          interfaces: [],
        };
  }
  /**
   * Returns whether one type is a possible runtime subtype of an abstract type.
   * @param abstractType - Interface or union type to inspect.
   * @param maybeSubType - Object or interface type to test as a possible subtype.
   * @returns True when the subtype may satisfy the abstract type.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   * import { assertInterfaceType, assertObjectType } from 'graphql/type';
   *
   * const schema = buildSchema(`
   *   interface Node {
   *     id: ID!
   *   }
   *
   *   type User implements Node {
   *     id: ID!
   *   }
   *
   *   type Review {
   *     body: String
   *   }
   *
   *   type Query {
   *     node: Node
   *     review: Review
   *   }
   * `);
   *
   * const Node = assertInterfaceType(schema.getType('Node'));
   * const User = assertObjectType(schema.getType('User'));
   * const Review = assertObjectType(schema.getType('Review'));
   *
   * schema.isSubType(Node, User); // => true
   * schema.isSubType(Node, Review); // => false
   * ```
   */

  isSubType(abstractType, maybeSubType) {
    let map = this._subTypeMap[abstractType.name];

    if (map === undefined) {
      map = Object.create(null);

      if ((0, _definition.isUnionType)(abstractType)) {
        for (const type of abstractType.getTypes()) {
          map[type.name] = true;
        }
      } else {
        const implementations = this.getImplementations(abstractType);

        for (const type of implementations.objects) {
          map[type.name] = true;
        }

        for (const type of implementations.interfaces) {
          map[type.name] = true;
        }
      }

      this._subTypeMap[abstractType.name] = map;
    }

    return map[maybeSubType.name] !== undefined;
  }
  /**
   * Returns directives available in this schema.
   * @returns Directives available in this schema.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   directive @upper on FIELD_DEFINITION
   *
   *   type Query {
   *     greeting: String @upper
   *   }
   * `);
   *
   * schema.getDirectives().map((directive) => directive.name); // => ['include', 'skip', 'deprecated', 'specifiedBy', 'oneOf', 'upper']
   * ```
   */

  getDirectives() {
    return this._directives;
  }
  /**
   * Returns the current directive definition.
   * @param name - The GraphQL name to look up.
   * @returns The current directive definition, if known.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   *
   * const schema = buildSchema(`
   *   directive @upper on FIELD_DEFINITION
   *
   *   type Query {
   *     greeting: String @upper
   *   }
   * `);
   *
   * schema.getDirective('upper')?.name; // => 'upper'
   * schema.getDirective('missing'); // => undefined
   * ```
   */

  getDirective(name) {
    return this.getDirectives().find((directive) => directive.name === name);
  }
  /**
   * Returns a normalized configuration object for this object.
   *
   * The returned config preserves the original `assumeValid` flag so the schema
   * can be recreated with the same validation behavior.
   * @returns A configuration object that can be used to recreate this object.
   * @example
   * ```ts
   * import { buildSchema } from 'graphql/utilities';
   * import { GraphQLSchema } from 'graphql/type';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   *
   * const config = schema.toConfig();
   * const schemaCopy = new GraphQLSchema(config);
   *
   * config.query?.name; // => 'Query'
   * schemaCopy.getQueryType()?.name; // => 'Query'
   * ```
   */

  toConfig() {
    return {
      description: this.description,
      query: this.getQueryType(),
      mutation: this.getMutationType(),
      subscription: this.getSubscriptionType(),
      types: Object.values(this.getTypeMap()),
      directives: this.getDirectives(),
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes,
      assumeValid: this.__validationErrors !== undefined,
    };
  }
}

exports.GraphQLSchema = GraphQLSchema;

function collectReferencedTypes(type, typeSet) {
  const namedType = (0, _definition.getNamedType)(type);

  if (!typeSet.has(namedType)) {
    typeSet.add(namedType);

    if ((0, _definition.isUnionType)(namedType)) {
      for (const memberType of namedType.getTypes()) {
        collectReferencedTypes(memberType, typeSet);
      }
    } else if (
      (0, _definition.isObjectType)(namedType) ||
      (0, _definition.isInterfaceType)(namedType)
    ) {
      for (const interfaceType of namedType.getInterfaces()) {
        collectReferencedTypes(interfaceType, typeSet);
      }

      for (const field of Object.values(namedType.getFields())) {
        collectReferencedTypes(field.type, typeSet);

        for (const arg of field.args) {
          collectReferencedTypes(arg.type, typeSet);
        }
      }
    } else if ((0, _definition.isInputObjectType)(namedType)) {
      for (const field of Object.values(namedType.getFields())) {
        collectReferencedTypes(field.type, typeSet);
      }
    }
  }

  return typeSet;
}
