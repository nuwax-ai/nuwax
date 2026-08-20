/** @category Values */
import { inspect } from '../jsutils/inspect.mjs';
import { keyMap } from '../jsutils/keyMap.mjs';
import { printPathArray } from '../jsutils/printPathArray.mjs';
import { GraphQLError } from '../error/GraphQLError.mjs';
import { Kind } from '../language/kinds.mjs';
import { print } from '../language/printer.mjs';
import { isInputType, isNonNullType } from '../type/definition.mjs';
import { coerceInputValue } from '../utilities/coerceInputValue.mjs';
import { typeFromAST } from '../utilities/typeFromAST.mjs';
import { valueFromAST } from '../utilities/valueFromAST.mjs';

/**
 * Prepares an object map of variableValues of the correct type based on the
 * provided variable definitions and arbitrary input. If the input cannot be
 * parsed to match the variable definitions, GraphQLError values are returned.
 *
 * Note: Returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 * @param schema - GraphQL schema to use.
 * @param varDefNodes - The variable definition AST nodes to coerce.
 * @param inputs - The runtime variable values keyed by variable name.
 * @param options - Optional variable coercion options, including error limits.
 * @returns Coerced variable values, or request errors.
 * @example
 * ```ts
 * // Coerce provided variables and apply operation defaults.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getVariableValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     reviews(stars: Int!, limit: Int = 10): [String]
 *   }
 * `);
 * const document = parse(`
 *   query ($stars: Int!, $limit: Int = 10) {
 *     reviews(stars: $stars, limit: $limit)
 *   }
 * `);
 * const operation = document.definitions[0];
 *
 * const result = getVariableValues(
 *   schema,
 *   operation.variableDefinitions,
 *   { stars: '5' },
 * );
 *
 * result; // => { coerced: { stars: 5, limit: 10 } }
 * ```
 * @example
 * ```ts
 * // This variant uses maxErrors to cap reported coercion errors.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getVariableValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   input ReviewInput {
 *     stars: Int!
 *   }
 *
 *   type Query {
 *     review(input: ReviewInput!): String
 *   }
 * `);
 * const document = parse(`
 *   query ($first: ReviewInput!, $second: ReviewInput!) {
 *     first: review(input: $first)
 *     second: review(input: $second)
 *   }
 * `);
 * const operation = document.definitions[0];
 *
 * const result = getVariableValues(
 *   schema,
 *   operation.variableDefinitions,
 *   { first: { stars: 'bad' }, second: { stars: 'also bad' } },
 *   { maxErrors: 1 },
 * );
 *
 * result.errors.length; // => 2
 * result.errors[1].message; // matches /error limit reached/
 * ```
 */
export function getVariableValues(schema, varDefNodes, inputs, options) {
  const errors = [];
  const maxErrors =
    options === null || options === void 0 ? void 0 : options.maxErrors;

  try {
    const coerced = coerceVariableValues(
      schema,
      varDefNodes,
      inputs,
      (error) => {
        if (maxErrors != null && errors.length >= maxErrors) {
          throw new GraphQLError(
            'Too many errors processing variables, error limit reached. Execution aborted.',
          );
        }

        errors.push(error);
      },
    );

    if (errors.length === 0) {
      return {
        coerced,
      };
    }
  } catch (error) {
    errors.push(error);
  }

  return {
    errors,
  };
}

function coerceVariableValues(schema, varDefNodes, inputs, onError) {
  const coercedValues = Object.create(null);

  for (const varDefNode of varDefNodes) {
    const varName = varDefNode.variable.name.value;
    const varType = typeFromAST(schema, varDefNode.type);

    if (!isInputType(varType)) {
      // Must use input types for variables. This should be caught during
      // validation, however is checked again here for safety.
      const varTypeStr = print(varDefNode.type);
      onError(
        new GraphQLError(
          `Variable "$${varName}" expected value of type "${varTypeStr}" which cannot be used as an input type.`,
          {
            nodes: varDefNode.type,
          },
        ),
      );
      continue;
    }

    if (!hasOwnProperty(inputs, varName)) {
      if (varDefNode.defaultValue) {
        coercedValues[varName] = valueFromAST(varDefNode.defaultValue, varType);
      } else if (isNonNullType(varType)) {
        const varTypeStr = inspect(varType);
        onError(
          new GraphQLError(
            `Variable "$${varName}" of required type "${varTypeStr}" was not provided.`,
            {
              nodes: varDefNode,
            },
          ),
        );
      }

      continue;
    }

    const value = inputs[varName];

    if (value === null && isNonNullType(varType)) {
      const varTypeStr = inspect(varType);
      onError(
        new GraphQLError(
          `Variable "$${varName}" of non-null type "${varTypeStr}" must not be null.`,
          {
            nodes: varDefNode,
          },
        ),
      );
      continue;
    }

    coercedValues[varName] = coerceInputValue(
      value,
      varType,
      (path, invalidValue, error) => {
        let prefix =
          `Variable "$${varName}" got invalid value ` + inspect(invalidValue);

        if (path.length > 0) {
          prefix += ` at "${varName}${printPathArray(path)}"`;
        }

        onError(
          new GraphQLError(prefix + '; ' + error.message, {
            nodes: varDefNode,
            originalError: error,
          }),
        );
      },
    );
  }

  return { ...coercedValues };
}
/**
 * Prepares an object map of argument values given a list of argument
 * definitions and list of argument AST nodes.
 *
 * Note: Returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 * @param def - The field or directive definition whose arguments should be coerced.
 * @param node - The AST node to inspect.
 * @param variableValues - The runtime variable values keyed by variable name.
 * @returns Coerced argument values keyed by argument name.
 * @example
 * ```ts
 * // Read literal argument values and defaults.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getArgumentValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     reviews(stars: Int!, limit: Int = 10): [String]
 *   }
 * `);
 * const fieldDef = schema.getQueryType().getFields().reviews;
 * const document = parse('{ reviews(stars: 5) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getArgumentValues(fieldDef, fieldNode); // => { stars: 5, limit: 10 }
 * ```
 * @example
 * ```ts
 * // This variant resolves argument values from operation variables.
 * import { parse } from 'graphql/language';
 * import { buildSchema } from 'graphql/utilities';
 * import { getArgumentValues } from 'graphql/execution';
 *
 * const schema = buildSchema(`
 *   type Query {
 *     reviews(stars: Int!): [String]
 *   }
 * `);
 * const fieldDef = schema.getQueryType().getFields().reviews;
 * const document = parse('query ($stars: Int!) { reviews(stars: $stars) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getArgumentValues(fieldDef, fieldNode, { stars: 5 }); // => { stars: 5 }
 * getArgumentValues(fieldDef, fieldNode, {}); // throws an error
 * ```
 */

export function getArgumentValues(def, node, variableValues) {
  var _node$arguments;

  const coercedValues = Object.create(null); // FIXME: https://github.com/graphql/graphql-js/issues/2203

  /* c8 ignore next */

  const argumentNodes =
    (_node$arguments = node.arguments) !== null && _node$arguments !== void 0
      ? _node$arguments
      : [];
  const argNodeMap = keyMap(argumentNodes, (arg) => arg.name.value);

  for (const argDef of def.args) {
    const name = argDef.name;
    const argType = argDef.type;
    const argumentNode = argNodeMap[name];

    if (!argumentNode) {
      if (argDef.defaultValue !== undefined) {
        coercedValues[name] = argDef.defaultValue;
      } else if (isNonNullType(argType)) {
        throw new GraphQLError(
          `Argument "${name}" of required type "${inspect(argType)}" ` +
            'was not provided.',
          {
            nodes: node,
          },
        );
      }

      continue;
    }

    const valueNode = argumentNode.value;
    let isNull = valueNode.kind === Kind.NULL;

    if (valueNode.kind === Kind.VARIABLE) {
      const variableName = valueNode.name.value;

      if (
        variableValues == null ||
        !hasOwnProperty(variableValues, variableName)
      ) {
        if (argDef.defaultValue !== undefined) {
          coercedValues[name] = argDef.defaultValue;
        } else if (isNonNullType(argType)) {
          throw new GraphQLError(
            `Argument "${name}" of required type "${inspect(argType)}" ` +
              `was provided the variable "$${variableName}" which was not provided a runtime value.`,
            {
              nodes: valueNode,
            },
          );
        }

        continue;
      }

      isNull = variableValues[variableName] == null;
    }

    if (isNull && isNonNullType(argType)) {
      throw new GraphQLError(
        `Argument "${name}" of non-null type "${inspect(argType)}" ` +
          'must not be null.',
        {
          nodes: valueNode,
        },
      );
    }

    const coercedValue = valueFromAST(valueNode, argType, variableValues);

    if (coercedValue === undefined) {
      // Note: ValuesOfCorrectTypeRule validation should catch this before
      // execution. This is a runtime check to ensure execution does not
      // continue with an invalid argument value.
      throw new GraphQLError(
        `Argument "${name}" has invalid value ${print(valueNode)}.`,
        {
          nodes: valueNode,
        },
      );
    }

    coercedValues[name] = coercedValue;
  }

  return { ...coercedValues };
}
/**
 * AST node shape accepted by getDirectiveValues.
 * @internal
 */

/**
 * Prepares an object map of argument values given a directive definition
 * and a AST node which may contain directives. Optionally also accepts a map
 * of variable values.
 *
 * If the directive does not exist on the node, returns undefined.
 *
 * Note: Returned value is a plain Object with a prototype, since it is
 * exposed to user code. Care should be taken to not pull values from the
 * Object prototype.
 * @param directiveDef - The directive definition whose arguments should be coerced.
 * @param node - The AST node to inspect.
 * @param variableValues - The runtime variable values keyed by variable name.
 * @returns Coerced directive argument values keyed by argument name.
 * @example
 * ```ts
 * // Read literal directive arguments from a node.
 * import { parse } from 'graphql/language';
 * import { GraphQLSkipDirective } from 'graphql/type';
 * import { getDirectiveValues } from 'graphql/execution';
 *
 * const document = parse('{ name @skip(if: true) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getDirectiveValues(GraphQLSkipDirective, fieldNode); // => { if: true }
 * ```
 * @example
 * ```ts
 * // This variant resolves directive arguments from variables and handles absent directives.
 * import { parse } from 'graphql/language';
 * import { GraphQLIncludeDirective } from 'graphql/type';
 * import { getDirectiveValues } from 'graphql/execution';
 *
 * const document = parse('query ($includeName: Boolean!) { name @include(if: $includeName) }');
 * const fieldNode = document.definitions[0].selectionSet.selections[0];
 *
 * getDirectiveValues(GraphQLIncludeDirective, fieldNode, {
 *   includeName: false,
 * }); // => { if: false }
 * getDirectiveValues(GraphQLIncludeDirective, { directives: [] }); // => undefined
 * ```
 */
export function getDirectiveValues(directiveDef, node, variableValues) {
  var _node$directives;

  const directiveNode =
    (_node$directives = node.directives) === null || _node$directives === void 0
      ? void 0
      : _node$directives.find(
          (directive) => directive.name.value === directiveDef.name,
        );

  if (directiveNode) {
    return getArgumentValues(directiveDef, directiveNode, variableValues);
  }
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
