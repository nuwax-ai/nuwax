import {
  parse
} from "./chunk-2ENXBMWA.mjs";
import "./chunk-HQDACWF7.mjs";
import "./chunk-CYW2HGLJ.mjs";
import "./chunk-CT5Q72BK.mjs";
import "./chunk-3O5MS6M4.mjs";
import "./chunk-D6UAH5RW.mjs";
import "./chunk-LJRZYMMA.mjs";
import "./chunk-NZTEHIZO.mjs";
import "./chunk-WM6EUEOH.mjs";
import "./chunk-D6MTONMS.mjs";
import {
  selectSvgElement
} from "./chunk-PUIB63ON.mjs";
import {
  configureSvgSize
} from "./chunk-Q52JI7PB.mjs";
import {
  log
} from "./chunk-V7P66DNM.mjs";
import "./chunk-BBDM4ZFP.mjs";
import "./chunk-NW2N4LI3.mjs";
import {
  __name
} from "./chunk-PTVI3W5X.mjs";

// src/diagrams/info/infoParser.ts
var parser = {
  parse: /* @__PURE__ */ __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};

// src/diagrams/info/infoDb.ts
var DEFAULT_INFO_DB = {
  version: "11.15.0" + (true ? "" : "-tiny")
};
var getVersion = /* @__PURE__ */ __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};

// src/diagrams/info/infoRenderer.ts
var draw = /* @__PURE__ */ __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };

// src/diagrams/info/infoDiagram.ts
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
