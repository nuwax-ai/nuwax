"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const atom = require("./atom.cjs");
const store = require("./store.cjs");
exports.batch = atom.batch;
exports.createAsyncAtom = atom.createAsyncAtom;
exports.createAtom = atom.createAtom;
exports.flush = atom.flush;
exports.toObserver = atom.toObserver;
exports.ReadonlyStore = store.ReadonlyStore;
exports.Store = store.Store;
exports.createStore = store.createStore;
//# sourceMappingURL=index.cjs.map
