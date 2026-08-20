import { locatedError as _locatedError, GraphQLError, versionInfo } from 'graphql';
const possibleGraphQLErrorProperties = [
    'message',
    'locations',
    'path',
    'nodes',
    'source',
    'positions',
    'originalError',
    'name',
    'stack',
    'extensions',
    'coordinate',
];
export function isGraphQLErrorLike(error) {
    return (error != null &&
        typeof error === 'object' &&
        Object.keys(error).every(key => possibleGraphQLErrorProperties.includes(key)));
}
export function createGraphQLError(message, options) {
    if (options?.originalError &&
        !(options.originalError instanceof Error) &&
        isGraphQLErrorLike(options.originalError)) {
        options.originalError = createGraphQLError(options.originalError.message, options.originalError);
    }
    // To avoid type error on graphql <16, we have to use an any type here
    const Constructor = GraphQLError;
    const error = versionInfo.major >= 16
        ? new Constructor(message, options)
        : new Constructor(message, options?.nodes, options?.source, options?.positions, options?.path, options?.originalError, options?.extensions);
    if (options?.coordinate && error.coordinate == null) {
        Object.defineProperties(error, {
            coordinate: { value: options.coordinate, enumerable: true, configurable: true },
        });
    }
    return error;
}
export function getSchemaCoordinate(error) {
    return error.coordinate;
}
export function locatedError(rawError, nodes, path, info) {
    const error = _locatedError(rawError, nodes, path);
    // `graphql` locatedError is only changing path and nodes if it is not already defined
    if (!error.coordinate && info && error.coordinate == null) {
        const coordinate = `${info.parentType.name}.${info.fieldName}`;
        Object.defineProperties(error, {
            coordinate: { value: coordinate, enumerable: true, configurable: true },
        });
    }
    return error;
}
export function relocatedError(originalError, path, info) {
    return createGraphQLError(originalError.message, {
        nodes: originalError.nodes,
        source: originalError.source,
        positions: originalError.positions,
        path: path == null ? originalError.path : path,
        originalError,
        extensions: originalError.extensions,
        coordinate: info ? `${info.parentType.name}.${info.fieldName}` : undefined,
    });
}
