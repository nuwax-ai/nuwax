import {
  StateDB,
  stateDiagram_default,
  stateRenderer_v3_unified_default,
  styles_default
} from "./chunk-AQP2D5EJ.mjs";
import "./chunk-55IACEB6.mjs";
import "./chunk-2J33WTMH.mjs";
import "./chunk-LZXEDZCA.mjs";
import "./chunk-KSCS5N6A.mjs";
import "./chunk-BSJP7CBP.mjs";
import "./chunk-3OPIFGDE.mjs";
import "./chunk-L5ZTLDWV.mjs";
import "./chunk-NZK2D7GU.mjs";
import "./chunk-O5CBEL6O.mjs";
import "./chunk-5ZQYHXKU.mjs";
import "./chunk-CSCIHK7Q.mjs";
import {
  __name
} from "./chunk-AGHRB4JF.mjs";

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
