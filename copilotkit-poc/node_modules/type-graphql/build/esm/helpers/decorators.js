export function getTypeDecoratorParams(returnTypeFuncOrOptions, maybeOptions) {
    if (typeof returnTypeFuncOrOptions === "function") {
        return {
            returnTypeFunc: returnTypeFuncOrOptions,
            options: maybeOptions || {},
        };
    }
    return {
        options: returnTypeFuncOrOptions || {},
    };
}
export function getNameDecoratorParams(nameOrOptions, maybeOptions) {
    if (typeof nameOrOptions === "string") {
        return {
            name: nameOrOptions,
            options: maybeOptions || {},
        };
    }
    return {
        options: nameOrOptions || {},
    };
}
export function getArrayFromOverloadedRest(overloadedArray) {
    let items;
    if (Array.isArray(overloadedArray[0])) {
        items = overloadedArray[0];
    }
    else {
        items = overloadedArray;
    }
    return items;
}
