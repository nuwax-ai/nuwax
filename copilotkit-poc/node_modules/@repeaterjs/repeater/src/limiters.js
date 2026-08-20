/// <reference types="./limiters.d.ts" />
import {
  safeRace
} from "./_chunks/chunk-RTTLBQUC.js";

// src/limiters.ts
import { Repeater, FixedBuffer } from "./core.js";
import { race } from "./combinators.js";
import { createDelay } from "./timers.js";
function createSemaphore(limit) {
  if (limit < 1) {
    throw new RangeError("limit cannot be less than 1");
  }
  let remaining = limit;
  const tokens = {};
  const bucket = new Repeater((push) => {
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
  }, new FixedBuffer(limit));
  return new Repeater(async (push, stop) => {
    let stopped = false;
    stop.then(() => stopped = true);
    for await (const token of race([bucket, stop])) {
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
  return new Repeater(async (push, stop) => {
    const timer = createDelay(wait);
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
    for await (const token of race([createSemaphore(limit), stop])) {
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
export {
  createSemaphore,
  createThrottle
};
