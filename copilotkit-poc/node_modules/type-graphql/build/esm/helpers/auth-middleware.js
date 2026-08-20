import { AuthenticationError, AuthorizationError } from "../errors/index.js";
export function AuthMiddleware(authChecker, container, authMode, roles) {
    return async (action, next) => {
        let accessGranted;
        if (authChecker.prototype) {
            const authCheckerInstance = await container.getInstance(authChecker, action);
            accessGranted = await authCheckerInstance.check(action, roles);
        }
        else {
            accessGranted = await authChecker(action, roles);
        }
        if (!accessGranted) {
            if (authMode === "null") {
                return null;
            }
            if (authMode === "error") {
                throw roles.length === 0 ? new AuthenticationError() : new AuthorizationError();
            }
        }
        return next();
    };
}
