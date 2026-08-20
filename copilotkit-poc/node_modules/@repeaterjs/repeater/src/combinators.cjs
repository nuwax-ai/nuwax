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

// src/combinators.ts
var combinators_exports = {};
__export(combinators_exports, {
  latest: () => latest,
  merge: () => merge,
  race: () => race,
  zip: () => zip
});
module.exports = __toCommonJS(combinators_exports);
var import_core = require("./core.cjs");

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

// src/combinators.ts
function getIterators(values, options) {
  const iters = [];
  for (const value of values) {
    if (value != null && typeof value[Symbol.asyncIterator] === "function") {
      iters.push(value[Symbol.asyncIterator]());
    } else if (value != null && typeof value[Symbol.iterator] === "function") {
      iters.push(value[Symbol.iterator]());
    } else {
      iters.push(
        async function* valueToAsyncIterator() {
          if (options.yieldValues) {
            yield value;
          }
          if (options.returnValues) {
            return value;
          }
        }()
      );
    }
  }
  return iters;
}
function race(contenders) {
  const iters = getIterators(contenders, { returnValues: true });
  return new import_core.Repeater(async (push, stop) => {
    if (!iters.length) {
      stop();
      return;
    }
    let finalIteration;
    try {
      while (true) {
        const tagged = iters.map(
          (iter) => Promise.resolve(iter.next()).then(
            (iteration2) => {
              if (iteration2.done) {
                stop();
                if (finalIteration === void 0) {
                  finalIteration = iteration2;
                }
              }
              return iteration2;
            },
            (err) => {
              stop(err);
              return void 0;
            }
          )
        );
        const iteration = await safeRace([...tagged, stop]);
        if (iteration === void 0 || iteration.done) {
          break;
        }
        await push(iteration.value);
      }
      return finalIteration && finalIteration.value;
    } finally {
      stop();
      await safeRace(iters.map((iter) => iter.return && iter.return()));
    }
  });
}
function merge(contenders) {
  const iters = getIterators(contenders, { yieldValues: true });
  return new import_core.Repeater(async (push, stop) => {
    if (!iters.length) {
      stop();
      return;
    }
    let finalIteration;
    try {
      await Promise.all(
        iters.map(async (iter) => {
          try {
            while (true) {
              let iteration;
              try {
                iteration = await safeRace([Promise.resolve(iter.next()), stop]);
              } catch (err) {
                stop(err);
                return;
              }
              if (iteration === void 0) {
                return;
              } else if (iteration.done) {
                finalIteration = iteration;
                return;
              }
              await push(iteration.value);
            }
          } finally {
            iter.return && await iter.return();
          }
        })
      );
      return finalIteration && finalIteration.value;
    } finally {
      stop();
    }
  });
}
function zip(contenders) {
  const iters = getIterators(contenders, { returnValues: true });
  return new import_core.Repeater(async (push, stop) => {
    if (!iters.length) {
      stop();
      return [];
    }
    try {
      while (true) {
        let iterations;
        try {
          iterations = await safeRace([
            Promise.all(iters.map((iter) => iter.next())),
            stop
          ]);
        } catch (err) {
          stop(err);
          return;
        }
        if (iterations === void 0) {
          return;
        }
        const values = iterations.map((iteration) => iteration.value);
        if (iterations.some((iteration) => iteration.done)) {
          return values;
        }
        await push(values);
      }
    } finally {
      stop();
      await Promise.all(iters.map((iter) => iter.return && iter.return()));
    }
  });
}
function latest(contenders) {
  const iters = getIterators(contenders, {
    yieldValues: true,
    returnValues: true
  });
  return new import_core.Repeater(async (push, stop) => {
    if (!iters.length) {
      stop();
      return [];
    }
    try {
      let iterations;
      try {
        iterations = await safeRace([
          Promise.all(iters.map((iter) => iter.next())),
          stop
        ]);
      } catch (err) {
        stop(err);
        return;
      }
      if (iterations === void 0) {
        return;
      }
      const values = iterations.map((iteration) => iteration.value);
      if (iterations.every((iteration) => iteration.done)) {
        return values;
      }
      await push(values.slice());
      return await Promise.all(
        iters.map(async (iter, i) => {
          if (iterations[i].done) {
            return iterations[i].value;
          }
          while (true) {
            let iteration;
            try {
              iteration = await safeRace([
                Promise.resolve(iter.next()),
                stop
              ]);
            } catch (err) {
              stop(err);
              return iterations[i].value;
            }
            if (iteration === void 0) {
              return iterations[i].value;
            } else if (iteration.done) {
              return iteration.value;
            }
            values[i] = iteration.value;
            await push(values.slice());
          }
        })
      );
    } finally {
      stop();
      await Promise.all(iters.map((iter) => iter.return && iter.return()));
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  latest,
  merge,
  race,
  zip
});
