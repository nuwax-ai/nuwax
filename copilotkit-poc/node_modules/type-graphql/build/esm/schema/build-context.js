import { IOCContainer } from "../utils/container.js";
export class BuildContext {
    static create(options) {
        if (options.scalarsMap !== undefined) {
            this.scalarsMaps = options.scalarsMap;
        }
        if (options.validate !== undefined) {
            this.validate = options.validate;
        }
        if (options.validateFn !== undefined) {
            this.validateFn = options.validateFn;
        }
        if (options.authChecker !== undefined) {
            this.authChecker = options.authChecker;
        }
        if (options.authMode !== undefined) {
            this.authMode = options.authMode;
        }
        if (options.pubSub !== undefined) {
            this.pubSub = options.pubSub;
        }
        if (options.globalMiddlewares) {
            this.globalMiddlewares = options.globalMiddlewares;
        }
        if (options.nullableByDefault !== undefined) {
            this.nullableByDefault = options.nullableByDefault;
        }
        if (options.disableInferringDefaultValues !== undefined) {
            this.disableInferringDefaultValues = options.disableInferringDefaultValues;
        }
        this.container = new IOCContainer(options.container);
    }
    static reset() {
        this.scalarsMaps = [];
        this.validate = false;
        this.validateFn = undefined;
        this.authChecker = undefined;
        this.authMode = "error";
        this.pubSub = undefined;
        this.globalMiddlewares = [];
        this.container = new IOCContainer();
        this.nullableByDefault = false;
        this.disableInferringDefaultValues = false;
    }
}
BuildContext.reset();
