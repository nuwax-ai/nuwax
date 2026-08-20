/// <reference types="./timers.d.ts" />
// src/timers.ts
import {
  Repeater,
  RepeaterOverflowError,
  MAX_QUEUE_LENGTH,
  SlidingBuffer
} from "./core.js";
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
  return new Repeater(async (push, stop) => {
    const timers = /* @__PURE__ */ new Set();
    let stopped = false;
    stop.then(() => stopped = true);
    try {
      while (!stopped) {
        const timer = new Timer(wait);
        timers.add(timer);
        if (timers.size > MAX_QUEUE_LENGTH) {
          throw new RepeaterOverflowError(
            `No more than ${MAX_QUEUE_LENGTH} calls to next are allowed on a single delay repeater.`
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
  return new Repeater(async (push, stop) => {
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
function createInterval(wait, buffer = new SlidingBuffer(1)) {
  return new Repeater(async (push, stop) => {
    push(Date.now());
    const timer = setInterval(() => push(Date.now()), wait);
    await stop;
    clearInterval(timer);
  }, buffer);
}
export {
  TimeoutError,
  createDelay,
  createInterval,
  createTimeout
};
