import { ComplexityEstimator } from '../../QueryComplexity.js';
import { GraphQLDirective } from 'graphql';
export declare type ComplexityDirectiveOptions = {
    name?: string;
};
export declare function createComplexityDirective(options?: ComplexityDirectiveOptions): GraphQLDirective;
export default function (options?: ComplexityDirectiveOptions): ComplexityEstimator;
