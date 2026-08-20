import { type ValidatorOptions } from "class-validator";
import { type GraphQLScalarType } from "graphql";
import { type AuthChecker, type AuthMode } from "../typings/index.js";
import { type Middleware } from "../typings/middleware.js";
import { type PubSub } from "../typings/subscriptions.js";
import { type ValidatorFn } from "../typings/ValidatorFn.js";
import { type ContainerGetter, type ContainerType, IOCContainer } from "../utils/container.js";
export interface ScalarsTypeMap {
    type: Function;
    scalar: GraphQLScalarType;
}
export type ValidateSettings = boolean | ValidatorOptions;
export interface BuildContextOptions {
    scalarsMap?: ScalarsTypeMap[];
    /**
     * Indicates if class-validator should be used to auto validate objects injected into params.
     * You can directly pass validator options to enable validator with a given options.
     */
    validate?: ValidateSettings;
    /**
     * Own validation function to check the args and inputs.
     */
    validateFn?: ValidatorFn;
    authChecker?: AuthChecker<any, any>;
    authMode?: AuthMode;
    pubSub?: PubSub;
    globalMiddlewares?: Array<Middleware<any>>;
    container?: ContainerType | ContainerGetter<any>;
    /**
     * Default value for type decorators, like `@Field({ nullable: true })`
     */
    nullableByDefault?: boolean;
    /**
     * Disable inferring default values from property initializers, like `created = new Date();`
     */
    disableInferringDefaultValues?: boolean;
}
export declare abstract class BuildContext {
    static scalarsMaps: ScalarsTypeMap[];
    static validate: ValidateSettings;
    static validateFn?: ValidatorFn;
    static authChecker?: AuthChecker<any, any>;
    static authMode: AuthMode;
    static pubSub?: PubSub;
    static globalMiddlewares: Array<Middleware<any>>;
    static container: IOCContainer;
    static nullableByDefault: boolean;
    static disableInferringDefaultValues: boolean;
    /**
     * Set static fields with current building context data
     */
    static create(options: BuildContextOptions): void;
    /**
     * Restore default settings
     */
    static reset(): void;
}
