"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgumentValidationError = void 0;
const graphql_1 = require("graphql");
class ArgumentValidationError extends graphql_1.GraphQLError {
    constructor(validationErrors) {
        super("Argument Validation Error", {
            extensions: {
                code: "BAD_USER_INPUT",
                validationErrors,
            },
        });
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.ArgumentValidationError = ArgumentValidationError;
