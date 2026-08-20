# GraphQL Query Complexity Analysis for graphql-js

[![npm](https://img.shields.io/npm/dm/graphql-query-complexity)](https://www.npmjs.com/package/graphql-query-complexity)
[![npm version](https://badge.fury.io/js/graphql-query-complexity.svg)](https://badge.fury.io/js/graphql-query-complexity)
[![CircleCI](https://circleci.com/gh/slicknode/graphql-query-complexity.svg?style=shield)](https://circleci.com/gh/slicknode/graphql-query-complexity)
[![Twitter Follow](https://img.shields.io/twitter/follow/slicknode?style=social)](https://twitter.com/slicknode)

This library provides GraphQL query analysis to reject complex queries to your GraphQL server.
It can be used to protect your GraphQL servers against resource exhaustion and DoS attacks.

This library was originally developed as part of the [Slicknode GraphQL Framework + Headless CMS](https://slicknode.com).

Works with [graphql-js](https://github.com/graphql/graphql-js) reference implementation.

## Installation

Install the package via npm

```bash
npm install -S graphql-query-complexity
```

## Usage

Create the rule with a maximum query complexity:

```javascript
import {
  createComplexityRule,
  simpleEstimator
} from 'graphql-query-complexity';

const rule = createComplexityRule({
  // The maximum allowed query complexity, queries above this threshold will be rejected
  maximumComplexity: 1000,

  // The query variables. This is needed because the variables are not available
  // in the visitor of the graphql-js library
  variables: {},

  // The context object for the request (optional)
  context: {}

  // specify operation name only when pass multi-operation documents
  operationName?: string,

  // Optional callback function to retrieve the determined query complexity
  // Will be invoked whether the query is rejected or not
  // This can be used for logging or to implement rate limiting
  onComplete: (complexity: number) => {console.log('Determined query complexity: ', complexity)},

  // Optional function to create a custom error
  createError: (max: number, actual: number) => {
    return new GraphQLError(`Query is too complex: ${actual}. Maximum allowed complexity: ${max}`);
  },

  // Add any number of estimators. The estimators are invoked in order, the first
  // numeric value that is being returned by an estimator is used as the field complexity.
  // If no estimator returns a value, an exception is raised.
  estimators: [
    // Add more estimators here...

    // This will assign each field a complexity of 1 if no other estimator
    // returned a value.
    simpleEstimator({
      defaultComplexity: 1
    })
  ]
});
```

## Configuration / Complexity Estimators

The complexity calculation of a GraphQL query can be customized with so called complexity estimators.
A complexity estimator is a simple function that calculates the complexity for a field. You can add
any number of complexity estimators to the rule, which are then executed one after another.
The first estimator that returns a numeric complexity value determines the complexity for that field.

At least one estimator has to return a complexity value, otherwise an exception is raised. You can
for example use the [simpleEstimator](./src/estimators/simple/README.md) as the last estimator
in your chain to define a default value.

You can use any of the available estimators to calculate the complexity of a field
or write your own:

- **[`simpleEstimator`](src/estimators/simple/README.md):** The simple estimator returns a fixed complexity for each field. Can be used as
  last estimator in the chain for a default value.
- **[`directiveEstimator`](src/estimators/directive/README.md):** Set the complexity via a directive in your
  schema definition (for example via GraphQL SDL)
- **[`fieldExtensionsEstimator`](src/estimators/fieldExtensions/README.md):** The field extensions estimator lets you set a numeric value or a custom estimator
  function in the field config extensions of your schema.
- PRs welcome...

Consult the documentation of each estimator for information about how to use them.

## Creating Custom Estimators

An estimator has the following function signature:

```typescript
type ComplexityEstimatorArgs = {
  // The composite type (interface, object, union) that the evaluated field belongs to
  type: GraphQLCompositeType;

  // The GraphQLField that is being evaluated
  field: GraphQLField<any, any>;

  // The GraphQL node that is being evaluated
  node: FieldNode;

  // The input arguments of the field
  args: { [key: string]: any };

  // The complexity of all child selections for that field
  childComplexity: number;

  // The context object for the request if it was provided
  context?: Record<string, any>;
};

type ComplexityEstimator = (options: ComplexityEstimatorArgs) => number | void;
```

## Usage with express-graphql

To use the query complexity analysis validation rule with express-graphql, use something like the
following:

```javascript
import {
  simpleEstimator,
  createComplexityRule,
} from 'graphql-query-complexity';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import schema from './schema';

const app = express();
app.use(
  '/api',
  graphqlHTTP(async (request, response, { variables }) => ({
    schema,
    validationRules: [
      createComplexityRule({
        estimators: [
          // Configure your estimators
          simpleEstimator({ defaultComplexity: 1 }),
        ],
        maximumComplexity: 1000,
        variables,
        onComplete: (complexity: number) => {
          console.log('Query Complexity:', complexity);
        },
      }),
    ],
  }))
);
```

## Calculate query complexity

If you want to calculate the complexity of a GraphQL query outside of the validation phase, for example to
return the complexity value in a resolver, you can calculate the complexity via `getComplexity`:

```javascript
import { getComplexity, simpleEstimator } from 'graphql-query-complexity';
import { parse } from 'graphql';

// Import your schema or get it form the info object in your resolver
import schema from './schema';

// You can also use gql template tag to get the parsed query
const query = parse(`
  query Q($count: Int) {
    some_value
    some_list(count: $count) {
      some_child_value
    }
  }
`);

try {
  const complexity = getComplexity({
    estimators: [simpleEstimator({ defaultComplexity: 1 })],
    schema,
    query,
    variables: {
      count: 10,
    },
  });

  console.log(complexity); // Output: 3
} catch (e) {
  // Log error in case complexity cannot be calculated (invalid query, misconfiguration, etc.)
  console.error('Could not calculate complexity', e.message);
}
```

## Prior Art

This project is inspired by the following prior projects:

- Query complexity analysis in the [Sangria GraphQL](http://sangria-graphql.org/) implementation.
- [graphql-cost-analysis](https://github.com/pa-bru/graphql-cost-analysis) - Multipliers and directiveEstimator
