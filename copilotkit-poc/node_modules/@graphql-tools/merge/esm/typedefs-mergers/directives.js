import { Kind, } from 'graphql';
function isRepeatableDirective(directive, directives, repeatableLinkImports) {
    return !!(directives?.[directive.name.value]?.repeatable ??
        repeatableLinkImports?.has(directive.name.value));
}
function nameAlreadyExists(name, namesArr) {
    return namesArr.some(({ value }) => value === name.value);
}
function mergeArguments(a1, a2) {
    const result = [];
    for (const argument of [...a2, ...a1]) {
        const existingIndex = result.findIndex(a => a.name.value === argument.name.value);
        if (existingIndex === -1) {
            result.push(argument);
        }
        else {
            const existingArg = result[existingIndex];
            if (existingArg.value.kind === 'ListValue') {
                const source = existingArg.value.values;
                const target = argument.value.values;
                // merge values of two lists
                existingArg.value = {
                    ...existingArg.value,
                    values: deduplicateLists(source, target, (targetVal, source) => {
                        const value = targetVal.value;
                        return !value || !source.some((sourceVal) => sourceVal.value === value);
                    }),
                };
            }
            else {
                existingArg.value = argument.value;
            }
        }
    }
    return result;
}
const matchValues = (a, b) => {
    if (a.kind === b.kind) {
        switch (a.kind) {
            case Kind.LIST:
                return (a.values.length === b.values.length &&
                    a.values.every(aVal => b.values.find(bVal => matchValues(aVal, bVal))));
            case Kind.VARIABLE:
            case Kind.NULL:
                return true;
            case Kind.OBJECT:
                return (a.fields.length === b.fields.length &&
                    a.fields.every(aField => b.fields.find(bField => aField.name.value === bField.name.value && matchValues(aField.value, bField.value))));
            default:
                return a.value === b.value;
        }
    }
    return false;
};
const isLinkDirective = (directive) => directive.name.value === 'link';
const getLinkDirectiveURL = (directive) => {
    const stringValue = isLinkDirective(directive)
        ? directive.arguments?.find(arg => arg.name.value === 'url')?.value
        : undefined;
    return stringValue?.kind === 'StringValue' ? stringValue.value : undefined;
};
const matchArguments = (a, b) => a.name.value === b.name.value && a.value.kind === b.value.kind && matchValues(a.value, b.value);
/**
 * Check if a directive is an exact match of another directive based on their
 * arguments.
 */
const matchDirectives = (a, b) => {
    const matched = a.name.value === b.name.value &&
        (a.arguments === b.arguments ||
            (a.arguments?.length === b.arguments?.length &&
                a.arguments?.every(argA => b.arguments?.find(argB => matchArguments(argA, argB)))));
    return !!matched;
};
export function mergeDirectives(d1 = [], d2 = [], config, directives) {
    const reverseOrder = config && config.reverseDirectives;
    const asNext = reverseOrder ? d1 : d2;
    const asFirst = reverseOrder ? d2 : d1;
    const result = [];
    for (const directive of [...asNext, ...asFirst]) {
        if (isRepeatableDirective(directive, directives, config?.repeatableLinkImports)) {
            // look for repeated, identical directives that come before this instance
            // if those exist, return null so that this directive gets removed.
            const exactDuplicate = result.find(d => matchDirectives(directive, d));
            if (!exactDuplicate) {
                result.push(directive);
            }
        }
        else {
            const firstAt = result.findIndex(d => d.name.value === directive.name.value);
            if (firstAt === -1) {
                // if did not find a directive with this name on the result set already
                result.push(directive);
            }
            else {
                if (isLinkDirective(directive) && isLinkDirective(result[firstAt])) {
                    const url1 = getLinkDirectiveURL(directive);
                    const url2 = getLinkDirectiveURL(result[firstAt]);
                    // if both are link directives but with different urls, do not merge them
                    if (url1 && url2 && url1 !== url2) {
                        result.push(directive);
                        continue;
                    }
                }
                // if not repeatable and found directive with the same name already in the result set,
                // then merge the arguments of the existing directive and the new directive
                const mergedArguments = mergeArguments(directive.arguments ?? [], result[firstAt].arguments ?? []);
                result[firstAt] = {
                    ...result[firstAt],
                    arguments: mergedArguments.length === 0 ? undefined : mergedArguments,
                };
            }
        }
    }
    return result;
}
export function mergeDirective(node, existingNode) {
    if (existingNode) {
        return {
            ...node,
            arguments: deduplicateLists(existingNode.arguments || [], node.arguments || [], (arg, existingArgs) => !nameAlreadyExists(arg.name, existingArgs.map(a => a.name))),
            locations: [
                ...existingNode.locations,
                ...node.locations.filter(name => !nameAlreadyExists(name, existingNode.locations)),
            ],
        };
    }
    return node;
}
function deduplicateLists(source, target, filterFn) {
    return source.concat(target.filter(val => filterFn(val, source)));
}
