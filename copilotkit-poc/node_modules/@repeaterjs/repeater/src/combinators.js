/// <reference types="./combinators.d.ts" />
import {
  safeRace
} from "./_chunks/chunk-RTTLBQUC.js";

// src/combinators.ts
import { Repeater } from "./core.js";
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
  return new Repeater(async (push, stop) => {
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
  return new Repeater(async (push, stop) => {
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
  return new Repeater(async (push, stop) => {
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
  return new Repeater(async (push, stop) => {
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
export {
  latest,
  merge,
  race,
  zip
};
