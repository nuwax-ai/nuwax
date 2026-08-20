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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  DroppingBuffer: () => import_core.DroppingBuffer,
  FixedBuffer: () => import_core.FixedBuffer,
  MAX_QUEUE_LENGTH: () => import_core.MAX_QUEUE_LENGTH,
  Repeater: () => Repeater,
  RepeaterOverflowError: () => import_core.RepeaterOverflowError,
  SlidingBuffer: () => import_core.SlidingBuffer,
  latest: () => import_combinators.latest,
  merge: () => import_combinators.merge,
  race: () => import_combinators.race,
  zip: () => import_combinators.zip
});
module.exports = __toCommonJS(src_exports);
var import_core = require("./core.cjs");
var import_combinators = require("./combinators.cjs");
var import_core2 = require("./core.cjs");
var import_combinators2 = require("./combinators.cjs");
var Repeater = class extends import_core2.Repeater {
  static race = import_combinators2.race;
  static merge = import_combinators2.merge;
  static zip = import_combinators2.zip;
  static latest = import_combinators2.latest;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
