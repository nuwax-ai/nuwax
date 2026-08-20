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

// src/limiters.ts
var limiters_exports = {};
__export(limiters_exports, {
  createSemaphore: () => createSemaphore,
  createThrottle: () => createThrottle
});
module.exports = __toCommonJS(limiters_exports);
var import_core = require("./core.cjs");
var import_combinators = require("./combinators.cjs");
var import_timers = require("./timers.cjs");

// src/_utils.ts
function isPromiseLike(value) {
  return value != null && typeof value.then === "function";
}
function createRaceRecord(contender) {
  const deferreds = /* @__PURE__ */ new Set();
  const record = { deferreds, settled: false };
  Promise.resolve(contender).then(
    (value) => {
      for (const { resolve } of deferreds) {
        resolve(value);
      }
      deferreds.clear();
      record.settled = true;
    },
    (err) => {
      for (const { reject } of deferreds) {
        reject(err);
      }
      deferreds.clear();
      record.settled = true;
    }
  );
  return record;
}
var wm = /* @__PURE__ */ new WeakMap();
function safeRace(contenders) {
  let deferred;
  const result = new Promise((resolve, reject) => {
    deferred = { resolve, reject };
    for (const contender of contenders) {
      if (!isPromiseLike(contender)) {
        Promise.resolve(contender).then(resolve, reject);
        continue;
      }
      let record = wm.get(contender);
      if (record === void 0) {
        record = createRaceRecord(contender);
        record.deferreds.add(deferred);
        wm.set(contender, record);
      } else if (record.settled) {
        Promise.resolve(contender).then(resolve, reject);
      } else {
        record.deferreds.add(deferred);
      }
    }
  });
  return result.finally(() => {
    for (const contender of contenders) {
      if (isPromiseLike(contender)) {
        const record = wm.get(contender);
        if (record) {
          record.deferreds.delete(deferred);
        }
      }
    }
  });
}

// src/limiters.ts
function createSemaphore(limit) {
  if (limit < 1) {
    throw new RangeError("limit cannot be less than 1");
  }
  let remaining = limit;
  const tokens = {};
  const bucket = new import_core.Repeater((push) => {
    let nextId = 0;
    function release(id) {
      if (tokens[id] != null) {
        const id1 = nextId++;
        const token = {
          ...tokens[id],
          id: id1,
          release: release.bind(null, id1)
        };
        push(token);
        delete tokens[id];
        remaining++;
      }
    }
    for (let i = 0; i < limit; i++) {
      const id = nextId++;
      const token = {
        id,
        limit,
        remaining,
        release: release.bind(null, id)
      };
      push(token);
    }
  }, new import_core.FixedBuffer(limit));
  return new import_core.Repeater(async (push, stop) => {
    let stopped = false;
    stop.then(() => stopped = true);
    for await (const token of (0, import_combinators.race)([bucket, stop])) {
      if (stopped) {
        break;
      }
      remaining--;
      const token1 = { ...token, remaining };
      tokens[token1.id] = token1;
      await push(token1);
    }
  });
}
function createThrottle(wait, options = {}) {
  const { limit = 1, cooldown = false } = options;
  if (limit < 1) {
    throw new RangeError("options.limit cannot be less than 1");
  }
  return new import_core.Repeater(async (push, stop) => {
    const timer = (0, import_timers.createDelay)(wait);
    const tokens = /* @__PURE__ */ new Set();
    let start = Date.now();
    let leaking;
    async function leak() {
      if (leaking != null) {
        return leaking;
      }
      start = Date.now();
      await timer.next();
      for (const token of tokens) {
        token.release();
      }
      tokens.clear();
      leaking = void 0;
    }
    let stopped = false;
    stop.then(() => stopped = true);
    for await (const token of (0, import_combinators.race)([createSemaphore(limit), stop])) {
      if (stopped) {
        break;
      }
      leaking = leak();
      let token1 = { ...token, reset: start + wait };
      tokens.add(token1);
      if (cooldown && token.remaining === 0) {
        await safeRace([stop, leaking]);
        token1 = { ...token1, remaining: limit };
      }
      await push(token1);
    }
    tokens.clear();
    await timer.return();
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSemaphore,
  createThrottle
});
