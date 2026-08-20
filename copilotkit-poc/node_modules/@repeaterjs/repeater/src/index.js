/// <reference types="./index.d.ts" />
// src/index.ts
import {
  RepeaterOverflowError,
  FixedBuffer,
  SlidingBuffer,
  DroppingBuffer,
  MAX_QUEUE_LENGTH
} from "./core.js";
import { race, merge, zip, latest } from "./combinators.js";
import { Repeater as RepeaterCore } from "./core.js";
import { race as race2, merge as merge2, zip as zip2, latest as latest2 } from "./combinators.js";
var Repeater = class extends RepeaterCore {
  static race = race2;
  static merge = merge2;
  static zip = zip2;
  static latest = latest2;
};
export {
  DroppingBuffer,
  FixedBuffer,
  MAX_QUEUE_LENGTH,
  Repeater,
  RepeaterOverflowError,
  SlidingBuffer,
  latest,
  merge,
  race,
  zip
};
