/** @category Validation Context */
import { Kind } from '../language/kinds.mjs';
import { visit } from '../language/visitor.mjs';
import { TypeInfo, visitWithTypeInfo } from '../utilities/TypeInfo.mjs';

/**
 * An instance of this class is passed as the "this" context to all validators,
 * allowing access to commonly useful contextual information from within a
 * validation rule.
 *
 * @internal
 */
export class ASTValidationContext {
  constructor(ast, onError) {
    this._ast = ast;
    this._fragments = undefined;
    this._fragmentSpreads = new Map();
    this._recursivelyReferencedFragments = new Map();
    this._onError = onError;
  }

  get [Symbol.toStringTag]() {
    return 'ASTValidationContext';
  }

  reportError(error) {
    this._onError(error);
  }

  getDocument() {
    return this._ast;
  }

  getFragment(name) {
    let fragments;

    if (this._fragments) {
      fragments = this._fragments;
    } else {
      fragments = Object.create(null);

      for (const defNode of this.getDocument().definitions) {
        if (defNode.kind === Kind.FRAGMENT_DEFINITION) {
          fragments[defNode.name.value] = defNode;
        }
      }

      this._fragments = fragments;
    }

    return fragments[name];
  }

  getFragmentSpreads(node) {
    let spreads = this._fragmentSpreads.get(node);

    if (!spreads) {
      spreads = [];
      const setsToVisit = [node];
      let set;

      while ((set = setsToVisit.pop())) {
        for (const selection of set.selections) {
          if (selection.kind === Kind.FRAGMENT_SPREAD) {
            spreads.push(selection);
          } else if (selection.selectionSet) {
            setsToVisit.push(selection.selectionSet);
          }
        }
      }

      this._fragmentSpreads.set(node, spreads);
    }

    return spreads;
  }

  getRecursivelyReferencedFragments(operation) {
    let fragments = this._recursivelyReferencedFragments.get(operation);

    if (!fragments) {
      fragments = [];
      const collectedNames = Object.create(null);
      const nodesToVisit = [operation.selectionSet];
      let node;

      while ((node = nodesToVisit.pop())) {
        for (const spread of this.getFragmentSpreads(node)) {
          const fragName = spread.name.value;

          if (collectedNames[fragName] !== true) {
            collectedNames[fragName] = true;
            const fragment = this.getFragment(fragName);

            if (fragment) {
              fragments.push(fragment);
              nodesToVisit.push(fragment.selectionSet);
            }
          }
        }
      }

      this._recursivelyReferencedFragments.set(operation, fragments);
    }

    return fragments;
  }
}
/** @internal */

/** @internal */
export class SDLValidationContext extends ASTValidationContext {
  constructor(ast, schema, onError) {
    super(ast, onError);
    this._schema = schema;
  }

  get [Symbol.toStringTag]() {
    return 'SDLValidationContext';
  }

  getSchema() {
    return this._schema;
  }
}
/** @internal */

/** Validation context passed to query validation rules. */
export class ValidationContext extends ASTValidationContext {
  /**
   * Creates a ValidationContext instance.
   * @param schema - Schema used to validate the document.
   * @param ast - Document AST being validated.
   * @param typeInfo - TypeInfo instance used to track traversal state.
   * @param onError - Callback invoked for each validation error.
   * @example
   * ```ts
   * import { parse } from 'graphql/language';
   * import { GraphQLError } from 'graphql/error';
   * import { buildSchema, TypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   * const document = parse('{ greeting }');
   * const errors = [];
   * const context = new ValidationContext(
   *   schema,
   *   document,
   *   new TypeInfo(schema),
   *   (error) => errors.push(error),
   * );
   *
   * context.reportError(new GraphQLError('Example validation error.'));
   *
   * context.getSchema(); // => schema
   * errors[0].message; // => 'Example validation error.'
   * ```
   */
  constructor(schema, ast, typeInfo, onError) {
    super(ast, onError);
    this._schema = schema;
    this._typeInfo = typeInfo;
    this._variableUsages = new Map();
    this._recursiveVariableUsages = new Map();
  }
  /**
   * Returns the value used by `Object.prototype.toString`.
   * @returns The built-in string tag for this object.
   */

  get [Symbol.toStringTag]() {
    return 'ValidationContext';
  }
  /**
   * Returns the schema being used by this validation context.
   * @returns The schema being validated against.
   * @example
   * ```ts
   * import { parse } from 'graphql/language';
   * import { buildSchema, TypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   * const context = new ValidationContext(
   *   schema,
   *   parse('{ greeting }'),
   *   new TypeInfo(schema),
   *   () => {},
   * );
   *
   * context.getSchema().getQueryType()?.name; // => 'Query'
   * ```
   */

  getSchema() {
    return this._schema;
  }
  /**
   * Returns variable usages found directly within this node.
   * @param node - The AST node to inspect or visit.
   * @returns Variable usages found directly within this node.
   * @example
   * ```ts
   * import { parse } from 'graphql/language';
   * import { buildSchema, TypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting(name: String): String
   *   }
   * `);
   * const document = parse('query ($name: String) { greeting(name: $name) }');
   * const operation = document.definitions[0];
   * const context = new ValidationContext(
   *   schema,
   *   document,
   *   new TypeInfo(schema),
   *   () => {},
   * );
   *
   * const usages = context.getVariableUsages(operation);
   *
   * usages[0].node.name.value; // => 'name'
   * String(usages[0].type); // => 'String'
   * ```
   */

  getVariableUsages(node) {
    let usages = this._variableUsages.get(node);

    if (!usages) {
      const newUsages = [];
      const typeInfo = new TypeInfo(this._schema);
      visit(
        node,
        visitWithTypeInfo(typeInfo, {
          VariableDefinition: () => false,

          Variable(variable) {
            newUsages.push({
              node: variable,
              type: typeInfo.getInputType(),
              defaultValue: typeInfo.getDefaultValue(),
              parentType: typeInfo.getParentInputType(),
            });
          },
        }),
      );
      usages = newUsages;

      this._variableUsages.set(node, usages);
    }

    return usages;
  }
  /**
   * Returns variable usages for an operation, including variables used by referenced fragments.
   * @param operation - Operation definition to inspect.
   * @returns Variable usages reachable from the operation.
   * @example
   * ```ts
   * import { parse } from 'graphql/language';
   * import { buildSchema, TypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     viewer: User
   *   }
   *
   *   type User {
   *     name(prefix: String): String
   *   }
   * `);
   * const document = parse(`
   *   query ($prefix: String) {
   *     viewer {
   *       ...UserName
   *     }
   *   }
   *
   *   fragment UserName on User {
   *     name(prefix: $prefix)
   *   }
   * `);
   * const operation = document.definitions[0];
   * const context = new ValidationContext(
   *   schema,
   *   document,
   *   new TypeInfo(schema),
   *   () => {},
   * );
   *
   * const usages = context.getRecursiveVariableUsages(operation);
   *
   * usages.map((usage) => usage.node.name.value); // => ['prefix']
   * ```
   */

  getRecursiveVariableUsages(operation) {
    let usages = this._recursiveVariableUsages.get(operation);

    if (!usages) {
      usages = this.getVariableUsages(operation);

      for (const frag of this.getRecursivelyReferencedFragments(operation)) {
        usages = usages.concat(this.getVariableUsages(frag));
      }

      this._recursiveVariableUsages.set(operation, usages);
    }

    return usages;
  }
  /**
   * Returns the current output type at this point in traversal.
   * @returns The current output type, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   * const document = parse('{ greeting }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let typeName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     Field: () => {
   *       typeName = String(context.getType());
   *     },
   *   }),
   * );
   *
   * typeName; // => 'String'
   * ```
   */

  getType() {
    return this._typeInfo.getType();
  }
  /**
   * Returns the current parent composite type.
   * @returns The current parent composite type, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   * const document = parse('{ greeting }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let parentTypeName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     Field: () => {
   *       parentTypeName = context.getParentType()?.name;
   *     },
   *   }),
   * );
   *
   * parentTypeName; // => 'Query'
   * ```
   */

  getParentType() {
    return this._typeInfo.getParentType();
  }
  /**
   * Returns the current input type at this point in traversal.
   * @returns The current input type, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     reviews(limit: Int): [String]
   *   }
   * `);
   * const document = parse('{ reviews(limit: 5) }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let inputTypeName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     Argument: () => {
   *       inputTypeName = String(context.getInputType());
   *     },
   *   }),
   * );
   *
   * inputTypeName; // => 'Int'
   * ```
   */

  getInputType() {
    return this._typeInfo.getInputType();
  }
  /**
   * Returns the parent input type for the current input position.
   * @returns The parent input type, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   input ReviewFilter {
   *     stars: Int
   *   }
   *
   *   type Query {
   *     reviews(filter: ReviewFilter): [String]
   *   }
   * `);
   * const document = parse('{ reviews(filter: { stars: 5 }) }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let parentInputTypeName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     ObjectField: () => {
   *       parentInputTypeName = String(context.getParentInputType());
   *     },
   *   }),
   * );
   *
   * parentInputTypeName; // => 'ReviewFilter'
   * ```
   */

  getParentInputType() {
    return this._typeInfo.getParentInputType();
  }
  /**
   * Returns the current field definition.
   * @returns The current field definition, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   * const document = parse('{ greeting }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let fieldName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     Field: () => {
   *       fieldName = context.getFieldDef()?.name;
   *     },
   *   }),
   * );
   *
   * fieldName; // => 'greeting'
   * ```
   */

  getFieldDef() {
    return this._typeInfo.getFieldDef();
  }
  /**
   * Returns the current directive definition.
   * @returns The current directive definition, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     greeting: String
   *   }
   * `);
   * const document = parse('{ greeting @include(if: true) }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let directiveName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     Directive: () => {
   *       directiveName = context.getDirective()?.name;
   *     },
   *   }),
   * );
   *
   * directiveName; // => 'include'
   * ```
   */

  getDirective() {
    return this._typeInfo.getDirective();
  }
  /**
   * Returns the current argument definition.
   * @returns The current argument definition, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   type Query {
   *     reviews(limit: Int): [String]
   *   }
   * `);
   * const document = parse('{ reviews(limit: 5) }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let argumentName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     Argument: () => {
   *       argumentName = context.getArgument()?.name;
   *     },
   *   }),
   * );
   *
   * argumentName; // => 'limit'
   * ```
   */

  getArgument() {
    return this._typeInfo.getArgument();
  }
  /**
   * Returns the current enum value definition.
   * @returns The current enum value definition, if known.
   * @example
   * ```ts
   * import { parse, visit } from 'graphql/language';
   * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
   * import { ValidationContext } from 'graphql/validation';
   *
   * const schema = buildSchema(`
   *   enum Sort {
   *     NEWEST
   *     OLDEST
   *   }
   *
   *   type Query {
   *     reviews(sort: Sort): [String]
   *   }
   * `);
   * const document = parse('{ reviews(sort: OLDEST) }');
   * const typeInfo = new TypeInfo(schema);
   * const context = new ValidationContext(schema, document, typeInfo, () => {});
   * let enumValueName;
   *
   * visit(
   *   document,
   *   visitWithTypeInfo(typeInfo, {
   *     EnumValue: () => {
   *       enumValueName = context.getEnumValue()?.name;
   *     },
   *   }),
   * );
   *
   * enumValueName; // => 'OLDEST'
   * ```
   */

  getEnumValue() {
    return this._typeInfo.getEnumValue();
  }
}
/** A function that creates an AST visitor for validating a GraphQL document. */
