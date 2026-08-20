"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOCContainer = void 0;
class DefaultContainer {
    constructor() {
        this.instances = [];
    }
    get(someClass) {
        let instance = this.instances.find(it => it.type === someClass);
        if (!instance) {
            instance = { type: someClass, object: new someClass() };
            this.instances.push(instance);
        }
        return instance.object;
    }
}
class IOCContainer {
    constructor(iocContainerOrContainerGetter) {
        this.defaultContainer = new DefaultContainer();
        if (iocContainerOrContainerGetter &&
            "get" in iocContainerOrContainerGetter &&
            typeof iocContainerOrContainerGetter.get === "function") {
            this.container = iocContainerOrContainerGetter;
        }
        else if (typeof iocContainerOrContainerGetter === "function") {
            this.containerGetter = iocContainerOrContainerGetter;
        }
    }
    getInstance(someClass, resolverData) {
        const container = this.containerGetter ? this.containerGetter(resolverData) : this.container;
        if (!container) {
            return this.defaultContainer.get(someClass);
        }
        return container.get(someClass, resolverData);
    }
}
exports.IOCContainer = IOCContainer;
