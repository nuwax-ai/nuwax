import { ArgumentValidationError } from "../errors/index.js";
const shouldArgBeValidated = (argValue) => argValue !== null && typeof argValue === "object";
export async function validateArg(argValue, argType, resolverData, globalValidateSettings, argValidateSettings, globalValidateFn, argValidateFn) {
    const validateFn = argValidateFn ?? globalValidateFn;
    if (typeof validateFn === "function") {
        await validateFn(argValue, argType, resolverData);
        return argValue;
    }
    const validate = argValidateSettings !== undefined ? argValidateSettings : globalValidateSettings;
    if (validate === false || !shouldArgBeValidated(argValue)) {
        return argValue;
    }
    const validatorOptions = {
        ...(typeof globalValidateSettings === "object" ? globalValidateSettings : {}),
        ...(typeof argValidateSettings === "object" ? argValidateSettings : {}),
    };
    if (validatorOptions.skipMissingProperties !== false) {
        validatorOptions.skipMissingProperties = true;
    }
    if (validatorOptions.forbidUnknownValues !== true) {
        validatorOptions.forbidUnknownValues = false;
    }
    const { validateOrReject } = await import("class-validator");
    try {
        if (Array.isArray(argValue)) {
            await Promise.all(argValue
                .filter(shouldArgBeValidated)
                .map(argItem => validateOrReject(argItem, validatorOptions)));
        }
        else {
            await validateOrReject(argValue, validatorOptions);
        }
        return argValue;
    }
    catch (err) {
        throw new ArgumentValidationError(err);
    }
}
