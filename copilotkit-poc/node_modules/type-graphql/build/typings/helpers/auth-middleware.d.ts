import { type AuthChecker, type AuthMode } from "../typings/index.js";
import { type MiddlewareFn } from "../typings/middleware.js";
import { type IOCContainer } from "../utils/container.js";
export declare function AuthMiddleware(authChecker: AuthChecker<any, any>, container: IOCContainer, authMode: AuthMode, roles: any[]): MiddlewareFn;
