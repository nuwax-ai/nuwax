import { AuthMiddleware } from "../helpers/auth-middleware.js";
import { convertToType } from "../helpers/types.js";
import { BuildContext } from "../schema/build-context.js";
import { isPromiseLike } from "../utils/isPromiseLike.js";
import { applyAuthChecker, applyMiddlewares, getParams } from "./helpers.js";
export function createHandlerResolver(resolverMetadata) {
    const { validate: globalValidate, validateFn, authChecker, authMode, globalMiddlewares, container, } = BuildContext;
    const middlewares = globalMiddlewares.concat(resolverMetadata.middlewares);
    applyAuthChecker(middlewares, authChecker, container, authMode, resolverMetadata.roles);
    return (root, args, context, info) => {
        const resolverData = { root, args, context, info };
        const targetInstanceOrPromise = container.getInstance(resolverMetadata.target, resolverData);
        if (isPromiseLike(targetInstanceOrPromise)) {
            return targetInstanceOrPromise.then(targetInstance => applyMiddlewares(container, resolverData, middlewares, () => {
                const params = getParams(resolverMetadata.params, resolverData, globalValidate, validateFn);
                if (isPromiseLike(params)) {
                    return params.then(resolvedParams => targetInstance[resolverMetadata.methodName].apply(targetInstance, resolvedParams));
                }
                return targetInstance[resolverMetadata.methodName].apply(targetInstance, params);
            }));
        }
        return applyMiddlewares(container, resolverData, middlewares, () => {
            const params = getParams(resolverMetadata.params, resolverData, globalValidate, validateFn);
            const targetInstance = targetInstanceOrPromise;
            if (isPromiseLike(params)) {
                return params.then(resolvedParams => targetInstance[resolverMetadata.methodName].apply(targetInstance, resolvedParams));
            }
            return targetInstance[resolverMetadata.methodName].apply(targetInstance, params);
        });
    };
}
export function createAdvancedFieldResolver(fieldResolverMetadata) {
    if (fieldResolverMetadata.kind === "external") {
        return createHandlerResolver(fieldResolverMetadata);
    }
    const targetType = fieldResolverMetadata.getObjectType();
    const { validate: globalValidate, validateFn, authChecker, authMode, globalMiddlewares, container, } = BuildContext;
    const middlewares = globalMiddlewares.concat(fieldResolverMetadata.middlewares);
    applyAuthChecker(middlewares, authChecker, container, authMode, fieldResolverMetadata.roles);
    return (root, args, context, info) => {
        const resolverData = { root, args, context, info };
        const targetInstance = convertToType(targetType, root);
        return applyMiddlewares(container, resolverData, middlewares, () => {
            const handlerOrGetterValue = targetInstance[fieldResolverMetadata.methodName];
            if (typeof handlerOrGetterValue !== "function") {
                return handlerOrGetterValue;
            }
            const params = getParams(fieldResolverMetadata.params, resolverData, globalValidate, validateFn);
            if (isPromiseLike(params)) {
                return params.then(resolvedParams => handlerOrGetterValue.apply(targetInstance, resolvedParams));
            }
            return handlerOrGetterValue.apply(targetInstance, params);
        });
    };
}
export function createBasicFieldResolver(fieldMetadata) {
    const { authChecker, authMode, globalMiddlewares, container } = BuildContext;
    const middlewares = globalMiddlewares.concat(fieldMetadata.middlewares);
    applyAuthChecker(middlewares, authChecker, container, authMode, fieldMetadata.roles);
    return (root, args, context, info) => {
        const resolverData = { root, args, context, info };
        return applyMiddlewares(container, resolverData, middlewares, () => root[fieldMetadata.name]);
    };
}
export function wrapResolverWithAuthChecker(resolver, container, roles) {
    const { authChecker, authMode } = BuildContext;
    if (!authChecker || !roles) {
        return resolver;
    }
    return (root, args, context, info) => {
        const resolverData = { root, args, context, info };
        return AuthMiddleware(authChecker, container, authMode, roles)(resolverData, async () => resolver(root, args, context, info));
    };
}
