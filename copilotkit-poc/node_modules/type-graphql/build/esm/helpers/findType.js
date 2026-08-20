import { NoExplicitTypeError } from "../errors/index.js";
import { ensureReflectMetadataExists } from "../metadata/utils.js";
import { bannedTypes } from "./returnTypes.js";
function findTypeValueArrayDepth([typeValueOrArray], innerDepth = 1) {
    if (!Array.isArray(typeValueOrArray)) {
        return { depth: innerDepth, returnType: typeValueOrArray };
    }
    return findTypeValueArrayDepth(typeValueOrArray, innerDepth + 1);
}
export function findType({ metadataKey, prototype, propertyKey, parameterIndex, argName, returnTypeFunc, typeOptions = {}, }) {
    const options = { ...typeOptions };
    let metadataDesignType;
    ensureReflectMetadataExists();
    const reflectedType = Reflect.getMetadata(metadataKey, prototype, propertyKey);
    if (reflectedType) {
        if (metadataKey === "design:paramtypes") {
            metadataDesignType = reflectedType[parameterIndex];
        }
        else {
            metadataDesignType = reflectedType;
        }
    }
    if (!returnTypeFunc && (!metadataDesignType || bannedTypes.includes(metadataDesignType))) {
        throw new NoExplicitTypeError(prototype.constructor.name, propertyKey, parameterIndex, argName);
    }
    if (returnTypeFunc) {
        const getType = () => {
            const returnTypeFuncReturnValue = returnTypeFunc();
            if (Array.isArray(returnTypeFuncReturnValue)) {
                const { depth, returnType } = findTypeValueArrayDepth(returnTypeFuncReturnValue);
                options.array = true;
                options.arrayDepth = depth;
                return returnType;
            }
            return returnTypeFuncReturnValue;
        };
        return {
            getType,
            typeOptions: options,
        };
    }
    if (metadataDesignType) {
        return {
            getType: () => metadataDesignType,
            typeOptions: options,
        };
    }
    throw new Error("Ops... this should never happen :)");
}
