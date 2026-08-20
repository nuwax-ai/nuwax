import { isSome } from './helpers.js';
export function mergeDeep(sources, respectPrototype = false, respectArrays = false, respectArrayLength = false) {
    if (sources.length === 0) {
        return;
    }
    if (sources.length === 1) {
        return sources[0];
    }
    let expectedLength;
    let allArrays = true;
    const areArraysInTheSameLength = sources.every(source => {
        if (Array.isArray(source)) {
            if (expectedLength === undefined) {
                expectedLength = source.length;
                return true;
            }
            else if (expectedLength === source.length) {
                return true;
            }
        }
        else {
            allArrays = false;
        }
        return false;
    });
    if (respectArrayLength && areArraysInTheSameLength) {
        return new Array(expectedLength).fill(null).map((_, index) => mergeDeep(sources.map(source => source[index]), respectPrototype, respectArrays, respectArrayLength));
    }
    if (allArrays) {
        return sources.flat(1);
    }
    let output;
    let firstObjectSource;
    if (respectPrototype) {
        firstObjectSource = sources.find(source => isObject(source));
        if (firstObjectSource) {
            if (output == null) {
                output = {};
            }
            Object.setPrototypeOf(output, Object.create(Object.getPrototypeOf(firstObjectSource)));
        }
    }
    for (const source of sources) {
        if (source == null) {
            continue;
        }
        if (isObject(source)) {
            if (firstObjectSource) {
                const outputPrototype = Object.getPrototypeOf(output);
                const sourcePrototype = Object.getPrototypeOf(source);
                if (sourcePrototype) {
                    for (const key of Object.getOwnPropertyNames(sourcePrototype)) {
                        const descriptor = Object.getOwnPropertyDescriptor(sourcePrototype, key);
                        if (isSome(descriptor)) {
                            Object.defineProperty(outputPrototype, key, descriptor);
                        }
                    }
                }
            }
            for (const key in source) {
                if (output == null) {
                    output = {};
                }
                if (key in output) {
                    output[key] = mergeDeep([output[key], source[key]], respectPrototype, respectArrays, respectArrayLength);
                }
                else {
                    output[key] = source[key];
                }
            }
        }
        else if (Array.isArray(source)) {
            if (!Array.isArray(output)) {
                output = source;
            }
            else {
                output = mergeDeep([output, source], respectPrototype, respectArrays, respectArrayLength);
            }
        }
        else {
            output = source;
        }
    }
    return output;
}
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
