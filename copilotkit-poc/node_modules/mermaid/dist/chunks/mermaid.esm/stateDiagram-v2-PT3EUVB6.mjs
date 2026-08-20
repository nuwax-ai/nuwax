import {
  StateDB,
  stateDiagram_default,
  stateRenderer_v3_unified_default,
  styles_default
} from "./chunk-L44QOBYK.mjs";
import "./chunk-7723GVCQ.mjs";
import "./chunk-KEUPHFFI.mjs";
import "./chunk-SNQTKDUU.mjs";
import "./chunk-TRQY2T3P.mjs";
import "./chunk-HQMLCRZ6.mjs";
import "./chunk-PLCLPJVV.mjs";
import "./chunk-GTILCTU2.mjs";
import "./chunk-RTI7CJYH.mjs";
import "./chunk-SZ5Y56Q4.mjs";
import "./chunk-YSJUE5HW.mjs";
import "./chunk-BSZA5ISF.mjs";
import "./chunk-7TFACZ55.mjs";
import "./chunk-Q52JI7PB.mjs";
import "./chunk-V7P66DNM.mjs";
import {
  __name
} from "./chunk-PTVI3W5X.mjs";

// src/diagrams/state/stateDiagram-v2.ts
var diagram = {
  parser: stateDiagram_default,
  get db() {
    return new StateDB(2);
  },
  renderer: stateRenderer_v3_unified_default,
  styles: styles_default,
  init: /* @__PURE__ */ __name((cnf) => {
    if (!cnf.state) {
      cnf.state = {};
    }
    cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  }, "init")
};
export {
  diagram
};
