"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/timers.ts
var timers_exports = {};
__export(timers_exports, {
  TimeoutError: () => TimeoutError,
  createDelay: () => createDelay,
  createInterval: () => createInterval,
  createTimeout: () => createTimeout
});
module.exports = __toCommonJS(timers_exports);
var import_core = require("./core.cjs");
var TimeoutError = class extends Error {
  constructor(message) {
    super(message);
    Object.defineProperty(this, "name", {
      value: "TimeoutError",
      enumerable: false
    });
    if (typeof Object.setPrototypeOf === "function") {
      Object.setPrototypeOf(this, new.target.prototype);
    } else {
      this.__proto__ = new.target.prototype;
    }
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var Timer = class {
  constructor(wait) {
    this.wait = wait;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  resolve;
  promise;
  reject;
  timeout;
  run(fn) {
    if (this.timeout != null) {
      throw new Error("Cannot run a timer multiple times");
    }
    this.timeout = setTimeout(() => {
      try {
        const value = fn();
        this.resolve(value);
      } catch (err) {
        this.reject(err);
      }
    }, this.wait);
  }
  clear() {
    clearTimeout(this.timeout);
    this.reject(new TimeoutError("Timer.clear called before stop"));
  }
};
function createDelay(wait) {
  return new import_core.Repeater(async (push, stop) => {
    const timers = /* @__PURE__ */ new Set();
    let stopped = false;
    stop.then(() => stopped = true);
    try {
      while (!stopped) {
        const timer = new Timer(wait);
        timers.add(timer);
        if (timers.size > import_core.MAX_QUEUE_LENGTH) {
          throw new import_core.RepeaterOverflowError(
            `No more than ${import_core.MAX_QUEUE_LENGTH} calls to next are allowed on a single delay repeater.`
          );
        }
        timer.run(() => {
          timers.delete(timer);
          return Date.now();
        });
        await push(timer.promise);
      }
    } finally {
      for (const timer of timers) {
        timer.clear();
      }
    }
  });
}
function createTimeout(wait) {
  return new import_core.Repeater(async (push, stop) => {
    let timer;
    let stopped = false;
    stop.then(() => stopped = true);
    try {
      while (!stopped) {
        if (timer !== void 0) {
          timer.resolve(void 0);
        }
        timer = new Timer(wait);
        timer.run(() => {
          throw new TimeoutError(`${wait}ms elapsed without next being called`);
        });
        await push(timer.promise);
      }
    } finally {
      if (timer !== void 0) {
        timer.clear();
      }
    }
  });
}
function createInterval(wait, buffer = new import_core.SlidingBuffer(1)) {
  return new import_core.Repeater(async (push, stop) => {
    push(Date.now());
    const timer = setInterval(() => push(Date.now()), wait);
    await stop;
    clearInterval(timer);
  }, buffer);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TimeoutError,
  createDelay,
  createInterval,
  createTimeout
});
