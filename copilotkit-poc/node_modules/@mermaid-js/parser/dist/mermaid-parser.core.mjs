import {
  RadarModule,
  createRadarServices
} from "./chunks/mermaid-parser.core/chunk-FHYWG6QK.mjs";
import {
  TreemapModule,
  createTreemapServices
} from "./chunks/mermaid-parser.core/chunk-BR22UD5L.mjs";
import {
  WardleyModule,
  createWardleyServices
} from "./chunks/mermaid-parser.core/chunk-PUPMXCY4.mjs";
import {
  GitGraphModule,
  createGitGraphServices
} from "./chunks/mermaid-parser.core/chunk-UIBZB4QT.mjs";
import {
  InfoModule,
  createInfoServices
} from "./chunks/mermaid-parser.core/chunk-5DO6E6H7.mjs";
import {
  PacketModule,
  createPacketServices
} from "./chunks/mermaid-parser.core/chunk-MPE355IW.mjs";
import {
  PieModule,
  createPieServices
} from "./chunks/mermaid-parser.core/chunk-MZUSXYTE.mjs";
import {
  TreeViewModule,
  createTreeViewServices
} from "./chunks/mermaid-parser.core/chunk-WCWK7LTN.mjs";
import {
  ArchitectureModule,
  createArchitectureServices
} from "./chunks/mermaid-parser.core/chunk-4EGX6M5U.mjs";
import {
  EventModelingModule,
  createEventModelingServices
} from "./chunks/mermaid-parser.core/chunk-N66VUXT2.mjs";
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
} from "./chunks/mermaid-parser.core/chunk-NNHCCRGN.mjs";

// src/parse.ts
var parsers = {};
var initializers = {
  info: /* @__PURE__ */ __name(async () => {
    const { createInfoServices: createInfoServices2 } = await import("./chunks/mermaid-parser.core/info-J43DQDTF.mjs");
    const parser = createInfoServices2().Info.parser.LangiumParser;
    parsers.info = parser;
  }, "info"),
  packet: /* @__PURE__ */ __name(async () => {
    const { createPacketServices: createPacketServices2 } = await import("./chunks/mermaid-parser.core/packet-YPE3B663.mjs");
    const parser = createPacketServices2().Packet.parser.LangiumParser;
    parsers.packet = parser;
  }, "packet"),
  pie: /* @__PURE__ */ __name(async () => {
    const { createPieServices: createPieServices2 } = await import("./chunks/mermaid-parser.core/pie-LRSECV5Y.mjs");
    const parser = createPieServices2().Pie.parser.LangiumParser;
    parsers.pie = parser;
  }, "pie"),
  treeView: /* @__PURE__ */ __name(async () => {
    const { createTreeViewServices: createTreeViewServices2 } = await import("./chunks/mermaid-parser.core/treeView-BLDUP644.mjs");
    const parser = createTreeViewServices2().TreeView.parser.LangiumParser;
    parsers.treeView = parser;
  }, "treeView"),
  architecture: /* @__PURE__ */ __name(async () => {
    const { createArchitectureServices: createArchitectureServices2 } = await import("./chunks/mermaid-parser.core/architecture-7EHR7CIX.mjs");
    const parser = createArchitectureServices2().Architecture.parser.LangiumParser;
    parsers.architecture = parser;
  }, "architecture"),
  gitGraph: /* @__PURE__ */ __name(async () => {
    const { createGitGraphServices: createGitGraphServices2 } = await import("./chunks/mermaid-parser.core/gitGraph-WXDBUCRP.mjs");
    const parser = createGitGraphServices2().GitGraph.parser.LangiumParser;
    parsers.gitGraph = parser;
  }, "gitGraph"),
  eventmodeling: /* @__PURE__ */ __name(async () => {
    const { createEventModelingServices: createEventModelingServices2 } = await import("./chunks/mermaid-parser.core/eventmodeling-FCH6USID.mjs");
    const parser = createEventModelingServices2().EventModel.parser.LangiumParser;
    parsers.eventmodeling = parser;
  }, "eventmodeling"),
  radar: /* @__PURE__ */ __name(async () => {
    const { createRadarServices: createRadarServices2 } = await import("./chunks/mermaid-parser.core/radar-GUYGQ44K.mjs");
    const parser = createRadarServices2().Radar.parser.LangiumParser;
    parsers.radar = parser;
  }, "radar"),
  treemap: /* @__PURE__ */ __name(async () => {
    const { createTreemapServices: createTreemapServices2 } = await import("./chunks/mermaid-parser.core/treemap-LRROVOQU.mjs");
    const parser = createTreemapServices2().Treemap.parser.LangiumParser;
    parsers.treemap = parser;
  }, "treemap"),
  wardley: /* @__PURE__ */ __name(async () => {
    const { createWardleyServices: createWardleyServices2 } = await import("./chunks/mermaid-parser.core/wardley-L42UT6IY.mjs");
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
