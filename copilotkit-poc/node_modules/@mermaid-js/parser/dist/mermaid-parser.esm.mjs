import {
  RadarModule,
  createRadarServices
} from "./chunks/mermaid-parser.esm/chunk-YSEVHDWN.mjs";
import {
  TreemapModule,
  createTreemapServices
} from "./chunks/mermaid-parser.esm/chunk-2ZAZGVDH.mjs";
import {
  WardleyModule,
  createWardleyServices
} from "./chunks/mermaid-parser.esm/chunk-F5IVBPYQ.mjs";
import {
  GitGraphModule,
  createGitGraphServices
} from "./chunks/mermaid-parser.esm/chunk-HI4RQQYL.mjs";
import {
  InfoModule,
  createInfoServices
} from "./chunks/mermaid-parser.esm/chunk-CDNQRGW5.mjs";
import {
  PacketModule,
  createPacketServices
} from "./chunks/mermaid-parser.esm/chunk-FA542ZDV.mjs";
import {
  PieModule,
  createPieServices
} from "./chunks/mermaid-parser.esm/chunk-BRXHIGYS.mjs";
import {
  TreeViewModule,
  createTreeViewServices
} from "./chunks/mermaid-parser.esm/chunk-JVRQLPLD.mjs";
import {
  ArchitectureModule,
  createArchitectureServices
} from "./chunks/mermaid-parser.esm/chunk-O7U5UWJI.mjs";
import {
  EventModelingModule,
  createEventModelingServices
} from "./chunks/mermaid-parser.esm/chunk-XO5BLW42.mjs";
import {
  AbstractMermaidTokenBuilder,
  AbstractMermaidValueConverter,
  Architecture,
  ArchitectureGrammarGeneratedModule,
  Branch,
  Commit,
  CommonTokenBuilder,
  CommonValueConverter,
  EmDataEntity,
  EmFrame,
  EventModel,
  EventModelingGeneratedModule,
  GitGraph,
  GitGraphGrammarGeneratedModule,
  Info,
  InfoGrammarGeneratedModule,
  Merge,
  MermaidGeneratedSharedModule,
  Packet,
  PacketBlock,
  PacketGrammarGeneratedModule,
  Pie,
  PieGrammarGeneratedModule,
  PieSection,
  Radar,
  RadarGrammarGeneratedModule,
  Statement,
  TreeNode,
  TreeView,
  TreeViewGrammarGeneratedModule,
  Treemap,
  TreemapGrammarGeneratedModule,
  Wardley,
  WardleyGrammarGeneratedModule,
  __name,
  isArchitecture,
  isBranch,
  isCommit,
  isEmModelEntityType,
  isEmResetFrame,
  isGitGraph,
  isInfo,
  isMerge,
  isPacket,
  isPacketBlock,
  isPie,
  isPieSection,
  isTreemap,
  isWardley
} from "./chunks/mermaid-parser.esm/chunk-PX4A6JQG.mjs";

// src/parse.ts
var parsers = {};
var initializers = {
  info: /* @__PURE__ */ __name(async () => {
    const { createInfoServices: createInfoServices2 } = await import("./chunks/mermaid-parser.esm/info-SWLXPZU4.mjs");
    const parser = createInfoServices2().Info.parser.LangiumParser;
    parsers.info = parser;
  }, "info"),
  packet: /* @__PURE__ */ __name(async () => {
    const { createPacketServices: createPacketServices2 } = await import("./chunks/mermaid-parser.esm/packet-KPNETGOL.mjs");
    const parser = createPacketServices2().Packet.parser.LangiumParser;
    parsers.packet = parser;
  }, "packet"),
  pie: /* @__PURE__ */ __name(async () => {
    const { createPieServices: createPieServices2 } = await import("./chunks/mermaid-parser.esm/pie-UWXWW4ZY.mjs");
    const parser = createPieServices2().Pie.parser.LangiumParser;
    parsers.pie = parser;
  }, "pie"),
  treeView: /* @__PURE__ */ __name(async () => {
    const { createTreeViewServices: createTreeViewServices2 } = await import("./chunks/mermaid-parser.esm/treeView-LF3TXDIX.mjs");
    const parser = createTreeViewServices2().TreeView.parser.LangiumParser;
    parsers.treeView = parser;
  }, "treeView"),
  architecture: /* @__PURE__ */ __name(async () => {
    const { createArchitectureServices: createArchitectureServices2 } = await import("./chunks/mermaid-parser.esm/architecture-CAO42JBL.mjs");
    const parser = createArchitectureServices2().Architecture.parser.LangiumParser;
    parsers.architecture = parser;
  }, "architecture"),
  gitGraph: /* @__PURE__ */ __name(async () => {
    const { createGitGraphServices: createGitGraphServices2 } = await import("./chunks/mermaid-parser.esm/gitGraph-57K5PIO2.mjs");
    const parser = createGitGraphServices2().GitGraph.parser.LangiumParser;
    parsers.gitGraph = parser;
  }, "gitGraph"),
  eventmodeling: /* @__PURE__ */ __name(async () => {
    const { createEventModelingServices: createEventModelingServices2 } = await import("./chunks/mermaid-parser.esm/eventmodeling-XMYRYC3M.mjs");
    const parser = createEventModelingServices2().EventModel.parser.LangiumParser;
    parsers.eventmodeling = parser;
  }, "eventmodeling"),
  radar: /* @__PURE__ */ __name(async () => {
    const { createRadarServices: createRadarServices2 } = await import("./chunks/mermaid-parser.esm/radar-IO5MLOUV.mjs");
    const parser = createRadarServices2().Radar.parser.LangiumParser;
    parsers.radar = parser;
  }, "radar"),
  treemap: /* @__PURE__ */ __name(async () => {
    const { createTreemapServices: createTreemapServices2 } = await import("./chunks/mermaid-parser.esm/treemap-2OLJKLT4.mjs");
    const parser = createTreemapServices2().Treemap.parser.LangiumParser;
    parsers.treemap = parser;
  }, "treemap"),
  wardley: /* @__PURE__ */ __name(async () => {
    const { createWardleyServices: createWardleyServices2 } = await import("./chunks/mermaid-parser.esm/wardley-WW5JX2LN.mjs");
    const parser = createWardleyServices2().Wardley.parser.LangiumParser;
    parsers.wardley = parser;
  }, "wardley")
};
async function parse(diagramType, text) {
  const initializer = initializers[diagramType];
  if (!initializer) {
    throw new Error(`Unknown diagram type: ${diagramType}`);
  }
  if (!parsers[diagramType]) {
    await initializer();
  }
  const parser = parsers[diagramType];
  const result = parser.parse(text);
  if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
    throw new MermaidParseError(result);
  }
  return result.value;
}
__name(parse, "parse");
var MermaidParseError = class extends Error {
  constructor(result) {
    const lexerErrors = result.lexerErrors.map((err) => {
      const line = err.line !== void 0 && !isNaN(err.line) ? err.line : "?";
      const column = err.column !== void 0 && !isNaN(err.column) ? err.column : "?";
      return `Lexer error on line ${line}, column ${column}: ${err.message}`;
    }).join("\n");
    const parserErrors = result.parserErrors.map((err) => {
      const line = err.token.startLine !== void 0 && !isNaN(err.token.startLine) ? err.token.startLine : "?";
      const column = err.token.startColumn !== void 0 && !isNaN(err.token.startColumn) ? err.token.startColumn : "?";
      return `Parse error on line ${line}, column ${column}: ${err.message}`;
    }).join("\n");
    super(`Parsing failed: ${lexerErrors} ${parserErrors}`);
    this.result = result;
  }
  static {
    __name(this, "MermaidParseError");
  }
};
export {
  AbstractMermaidTokenBuilder,
  AbstractMermaidValueConverter,
  Architecture,
  ArchitectureGrammarGeneratedModule as ArchitectureGeneratedModule,
  ArchitectureModule,
  Branch,
  Commit,
  CommonTokenBuilder,
  CommonValueConverter,
  EmDataEntity,
  EmFrame,
  EventModel,
  EventModelingGeneratedModule,
  EventModelingModule,
  GitGraph,
  GitGraphGrammarGeneratedModule as GitGraphGeneratedModule,
  GitGraphModule,
  Info,
  InfoGrammarGeneratedModule as InfoGeneratedModule,
  InfoModule,
  Merge,
  MermaidGeneratedSharedModule,
  MermaidParseError,
  Packet,
  PacketBlock,
  PacketGrammarGeneratedModule as PacketGeneratedModule,
  PacketModule,
  Pie,
  PieGrammarGeneratedModule as PieGeneratedModule,
  PieModule,
  PieSection,
  Radar,
  RadarGrammarGeneratedModule as RadarGeneratedModule,
  RadarModule,
  Statement,
  TreeNode,
  TreeView,
  TreeViewGrammarGeneratedModule as TreeViewGeneratedModule,
  TreeViewModule,
  Treemap,
  TreemapGrammarGeneratedModule as TreemapGeneratedModule,
  TreemapModule,
  Wardley,
  WardleyGrammarGeneratedModule as WardleyGeneratedModule,
  WardleyModule,
  createArchitectureServices,
  createEventModelingServices,
  createGitGraphServices,
  createInfoServices,
  createPacketServices,
  createPieServices,
  createRadarServices,
  createTreeViewServices,
  createTreemapServices,
  createWardleyServices,
  isArchitecture,
  isBranch,
  isCommit,
  isEmModelEntityType,
  isEmResetFrame,
  isGitGraph,
  isInfo,
  isMerge,
  isPacket,
  isPacketBlock,
  isPie,
  isPieSection,
  isTreemap,
  isWardley,
  parse
};
