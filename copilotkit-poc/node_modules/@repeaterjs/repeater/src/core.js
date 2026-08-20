/// <reference types="./core.d.ts" />
// src/core.ts
var RepeaterOverflowError = class extends Error {
  constructor(message) {
    super(message);
    Object.defineProperty(this, "name", {
      value: "RepeaterOverflowError",
      enumerable: false
    });
    if (typeof Object.setPrototypeOf === "function") {
      Object.setPrototypeOf(this, this.constructor.prototype);
    } else {
      this.__proto__ = this.constructor.prototype;
    }
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var FixedBuffer = class {
  // capacity
  _c;
  // queue
  _q;
  constructor(capacity) {
    if (capacity < 0) {
      throw new RangeError("Capacity may not be less than 0");
    }
    this._c = capacity;
    this._q = [];
  }
  get empty() {
    return this._q.length === 0;
  }
  get full() {
    return this._q.length >= this._c;
  }
  add(value) {
    if (this.full) {
      throw new Error("Buffer full");
    } else {
      this._q.push(value);
    }
  }
  remove() {
    if (this.empty) {
      throw new Error("Buffer empty");
    }
    return this._q.shift();
  }
};
var SlidingBuffer = class {
  // capacity
  _c;
  // queue
  _q;
  constructor(capacity) {
    if (capacity < 1) {
      throw new RangeError("Capacity may not be less than 1");
    }
    this._c = capacity;
    this._q = [];
  }
  get empty() {
    return this._q.length === 0;
  }
  get full() {
    return false;
  }
  add(value) {
    while (this._q.length >= this._c) {
      this._q.shift();
    }
    this._q.push(value);
  }
  remove() {
    if (this.empty) {
      throw new Error("Buffer empty");
    }
    return this._q.shift();
  }
};
var DroppingBuffer = class {
  // capacity
  _c;
  // queue
  _q;
  constructor(capacity) {
    if (capacity < 1) {
      throw new RangeError("Capacity may not be less than 1");
    }
    this._c = capacity;
    this._q = [];
  }
  get empty() {
    return this._q.length === 0;
  }
  get full() {
    return false;
  }
  add(value) {
    if (this._q.length < this._c) {
      this._q.push(value);
    }
  }
  remove() {
    if (this.empty) {
      throw new Error("Buffer empty");
    }
    return this._q.shift();
  }
};
function swallow(value) {
  if (value != null && typeof value.then === "function") {
    value.then(NOOP, NOOP);
  }
}
var Initial = 0;
var Started = 1;
var Stopped = 2;
var Done = 3;
var Rejected = 4;
var MAX_QUEUE_LENGTH = 1024;
var NOOP = () => {
};
function consumeExecution(r) {
  const err = r.err;
  const execution = Promise.resolve(r.execution).then((value) => {
    if (err != null) {
      throw err;
    }
    return value;
  });
  r.err = void 0;
  r.execution = execution.then(
    () => void 0,
    () => void 0
  );
  return r.pending === void 0 ? execution : r.pending.then(() => execution);
}
function createIteration(r, value) {
  const done = r.state >= Done;
  return Promise.resolve(value).then((value2) => {
    if (!done && r.state >= Rejected) {
      return consumeExecution(r).then((value3) => ({
        value: value3,
        done: true
      }));
    }
    return { value: value2, done };
  });
}
function stop(r, err) {
  if (r.state >= Stopped) {
    return;
  }
  r.state = Stopped;
  r.onnext();
  r.onstop();
  if (r.err == null) {
    r.err = err;
  }
  if (r.pushes.length === 0 && (typeof r.buffer === "undefined" || r.buffer.empty)) {
    finish(r);
  } else {
    for (const push2 of r.pushes) {
      push2.resolve();
    }
  }
}
function finish(r) {
  if (r.state >= Done) {
    return;
  }
  if (r.state < Stopped) {
    stop(r);
  }
  r.state = Done;
  r.buffer = void 0;
  for (const next of r.nexts) {
    const execution = r.pending === void 0 ? consumeExecution(r) : r.pending.then(() => consumeExecution(r));
    next.resolve(createIteration(r, execution));
  }
  r.pushes = [];
  r.nexts = [];
}
function reject(r) {
  if (r.state >= Rejected) {
    return;
  }
  if (r.state < Done) {
    finish(r);
  }
  r.state = Rejected;
}
function push(r, value) {
  swallow(value);
  if (r.pushes.length >= MAX_QUEUE_LENGTH) {
    throw new RepeaterOverflowError(
      `No more than ${MAX_QUEUE_LENGTH} pending calls to push are allowed on a single repeater.`
    );
  } else if (r.state >= Stopped) {
    return Promise.resolve(void 0);
  }
  let valueP = r.pending === void 0 ? Promise.resolve(value) : r.pending.then(() => value);
  valueP = valueP.catch((err) => {
    if (r.state < Stopped) {
      r.err = err;
    }
    reject(r);
    return void 0;
  });
  let nextP;
  if (r.nexts.length) {
    const next2 = r.nexts.shift();
    next2.resolve(createIteration(r, valueP));
    if (r.nexts.length) {
      nextP = Promise.resolve(r.nexts[0].value);
    } else if (typeof r.buffer !== "undefined" && !r.buffer.full) {
      nextP = Promise.resolve(void 0);
    } else {
      nextP = new Promise((resolve) => r.onnext = resolve);
    }
  } else if (typeof r.buffer !== "undefined" && !r.buffer.full) {
    r.buffer.add(valueP);
    nextP = Promise.resolve(void 0);
  } else {
    nextP = new Promise((resolve) => r.pushes.push({ resolve, value: valueP }));
  }
  let floating = true;
  const next = Object.create(nextP);
  const unhandled = nextP.catch((err) => {
    if (floating) {
      throw err;
    }
    return void 0;
  });
  next.then = (onfulfilled, onrejected) => {
    floating = false;
    return Promise.prototype.then.call(nextP, onfulfilled, onrejected);
  };
  next.catch = (onrejected) => {
    floating = false;
    return Promise.prototype.catch.call(nextP, onrejected);
  };
  next.finally = nextP.finally.bind(nextP);
  r.pending = valueP.then(() => unhandled).catch((err) => {
    r.err = err;
    reject(r);
  });
  return next;
}
function createStop(r) {
  const stopP = new Promise((resolve) => r.onstop = () => resolve(void 0));
  return Object.assign(stop.bind(null, r), {
    then: stopP.then.bind(stopP),
    catch: stopP.catch.bind(stopP),
    finally: stopP.finally.bind(stopP)
  });
}
function execute(r) {
  if (r.state >= Started) {
    return;
  }
  r.state = Started;
  const push1 = push.bind(null, r);
  const stop1 = createStop(r);
  r.execution = new Promise((resolve) => resolve(r.executor(push1, stop1)));
  r.execution.catch(() => stop(r));
}
var records = /* @__PURE__ */ new WeakMap();
var Repeater = class {
  constructor(executor, buffer) {
    records.set(this, {
      executor,
      buffer,
      err: void 0,
      state: Initial,
      pushes: [],
      nexts: [],
      pending: void 0,
      execution: void 0,
      onnext: NOOP,
      onstop: NOOP
    });
  }
  next(value) {
    swallow(value);
    const r = records.get(this);
    if (r === void 0) {
      throw new Error("WeakMap error");
    }
    if (r.nexts.length >= MAX_QUEUE_LENGTH) {
      throw new RepeaterOverflowError(
        `No more than ${MAX_QUEUE_LENGTH} pending calls to next are allowed on a single repeater.`
      );
    }
    if (r.state <= Initial) {
      execute(r);
    }
    r.onnext(value);
    if (typeof r.buffer !== "undefined" && !r.buffer.empty) {
      const result = createIteration(
        r,
        r.buffer.remove()
      );
      if (r.pushes.length) {
        const push2 = r.pushes.shift();
        r.buffer.add(push2.value);
        r.onnext = push2.resolve;
      }
      return result;
    } else if (r.pushes.length) {
      const push2 = r.pushes.shift();
      r.onnext = push2.resolve;
      return createIteration(r, push2.value);
    } else if (r.state >= Stopped) {
      finish(r);
      return createIteration(r, consumeExecution(r));
    }
    return new Promise((resolve) => r.nexts.push({ resolve, value }));
  }
  return(value) {
    swallow(value);
    const r = records.get(this);
    if (r === void 0) {
      throw new Error("WeakMap error");
    }
    finish(r);
    r.execution = Promise.resolve(r.execution).then(() => value);
    return createIteration(r, consumeExecution(r));
  }
  throw(err) {
    const r = records.get(this);
    if (r === void 0) {
      throw new Error("WeakMap error");
    }
    if (r.state <= Initial || r.state >= Stopped || typeof r.buffer !== "undefined" && !r.buffer.empty) {
      finish(r);
      if (r.err == null) {
        r.err = err;
      }
      return createIteration(r, consumeExecution(r));
    }
    return this.next(Promise.reject(err));
  }
  [Symbol.asyncIterator]() {
    return this;
  }
};
if (typeof Symbol.asyncDispose === "symbol") {
  Repeater.prototype[Symbol.asyncDispose] = function() {
    return this.return();
  };
}
if (typeof Symbol.dispose === "symbol") {
  Repeater.prototype[Symbol.dispose] = function() {
    this.return();
  };
}
export {
  DroppingBuffer,
  FixedBuffer,
  MAX_QUEUE_LENGTH,
  Repeater,
  RepeaterOverflowError,
  SlidingBuffer
};
