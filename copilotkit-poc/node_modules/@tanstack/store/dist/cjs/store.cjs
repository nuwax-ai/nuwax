"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const atom = require("./atom.cjs");
class Store {
  constructor(valueOrFn) {
    this.atom = atom.createAtom(
      valueOrFn
    );
  }
  setState(updater) {
    this.atom.set(updater);
  }
  get state() {
    return this.atom.get();
  }
  get() {
    return this.state;
  }
  subscribe(observerOrFn) {
    return this.atom.subscribe(atom.toObserver(observerOrFn));
  }
}
class ReadonlyStore {
  constructor(valueOrFn) {
    this.atom = atom.createAtom(
      valueOrFn
    );
  }
  get state() {
    return this.atom.get();
  }
  get() {
    return this.state;
  }
  subscribe(observerOrFn) {
    return this.atom.subscribe(atom.toObserver(observerOrFn));
  }
}
function createStore(valueOrFn) {
  if (typeof valueOrFn === "function") {
    return new ReadonlyStore(valueOrFn);
  }
  return new Store(valueOrFn);
}
exports.ReadonlyStore = ReadonlyStore;
exports.Store = Store;
exports.createStore = createStore;
//# sourceMappingURL=store.cjs.map
