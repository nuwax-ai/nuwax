import { ValidationContext } from 'graphql';
import QueryComplexity from './QueryComplexity.js';
import { QueryComplexityOptions } from './QueryComplexity.js';
export declare function createComplexityRule(options: QueryComplexityOptions): (context: ValidationContext) => QueryComplexity;
