import { GraphQLError } from "graphql";
export class ArgumentValidationError extends GraphQLError {
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
