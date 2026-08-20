export const useValidationRule = (rule) => {
    return {
        onValidate({ addValidationRule }) {
            addValidationRule(rule);
        },
    };
};
