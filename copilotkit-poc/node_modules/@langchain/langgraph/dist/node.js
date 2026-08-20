import { AsyncLocalStorageProviderSingleton } from "@langchain/core/singletons";
import { AsyncLocalStorage } from "node:async_hooks";
//#region src/node.ts
function initializeAsyncLocalStorageSingleton() {
	AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new AsyncLocalStorage());
}
//#endregion
export { initializeAsyncLocalStorageSingleton };

//# sourceMappingURL=node.js.map