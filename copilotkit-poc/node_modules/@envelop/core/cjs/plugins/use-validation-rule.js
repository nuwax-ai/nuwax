"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useValidationRule = void 0;
const useValidationRule = (rule) => {
    return {
        onValidate({ addValidationRule }) {
            addValidationRule(rule);
        },
    };
};
exports.useValidationRule = useValidationRule;
