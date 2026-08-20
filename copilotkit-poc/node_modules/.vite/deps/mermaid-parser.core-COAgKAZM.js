import { _ as createDefaultCoreModule, a as EmptyFileSystem, c as InfoGrammarGeneratedModule, d as PieGrammarGeneratedModule, f as RadarGrammarGeneratedModule, g as __name, h as WardleyGrammarGeneratedModule, i as CommonValueConverter, l as MermaidGeneratedSharedModule, m as TreemapGrammarGeneratedModule, n as AbstractMermaidValueConverter, o as EventModelingGeneratedModule, p as TreeViewGrammarGeneratedModule, r as ArchitectureGrammarGeneratedModule, s as GitGraphGrammarGeneratedModule, t as AbstractMermaidTokenBuilder, u as PacketGrammarGeneratedModule, v as createDefaultSharedCoreModule, y as inject } from "./chunk-NNHCCRGN-CwJaV-VY.js";
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-4EGX6M5U.mjs
var ArchitectureTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "ArchitectureTokenBuilder");
	}
	constructor() {
		super(["architecture"]);
	}
};
var ArchitectureValueConverter = class extends AbstractMermaidValueConverter {
	static {
		__name(this, "ArchitectureValueConverter");
	}
	runCustomConverter(rule, input, _cstNode) {
		if (rule.name === "ARCH_ICON") return input.replace(/[()]/g, "").trim();
		else if (rule.name === "ARCH_TEXT_ICON") return input.replace(/["()]/g, "");
		else if (rule.name === "ARCH_TITLE") {
			let result = input.replace(/^\[|]$/g, "").trim();
			if (result.startsWith("\"") && result.endsWith("\"") || result.startsWith("'") && result.endsWith("'")) {
				result = result.slice(1, -1);
				result = result.replace(/\\"/g, "\"").replace(/\\'/g, "'");
			}
			return result.trim();
		}
	}
};
var ArchitectureModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new ArchitectureTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new ArchitectureValueConverter(), "ValueConverter")
} };
function createArchitectureServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Architecture = inject(createDefaultCoreModule({ shared }), ArchitectureGrammarGeneratedModule, ArchitectureModule);
	shared.ServiceRegistry.register(Architecture);
	return {
		shared,
		Architecture
	};
}
__name(createArchitectureServices, "createArchitectureServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-N66VUXT2.mjs
var EventModelingTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "EventModelingTokenBuilder");
	}
	constructor() {
		super(["eventmodeling"]);
	}
};
var COMMAND_TYPES = /* @__PURE__ */ new Set(["cmd", "command"]);
var EVENT_TYPES = /* @__PURE__ */ new Set(["evt", "event"]);
var READMODEL_TYPES = /* @__PURE__ */ new Set(["rmo", "readmodel"]);
var PROCESSOR_TYPES = /* @__PURE__ */ new Set(["pcr", "processor"]);
var UI_TYPES = /* @__PURE__ */ new Set(["ui"]);
function registerValidationChecks$1(services) {
	const validator = services.validation.EventModelingValidator;
	const registry = services.validation.ValidationRegistry;
	if (registry) {
		const checks = {
			EmTimeFrame: validator.checkSourceFrameTypes.bind(validator),
			EmResetFrame: validator.checkSourceFrameTypes.bind(validator)
		};
		registry.register(checks, validator);
	}
}
__name(registerValidationChecks$1, "registerValidationChecks");
var EventModelingValidator = class {
	static {
		__name(this, "EventModelingValidator");
	}
	checkSourceFrameTypes(frame, accept) {
		if (frame.sourceFrames.length === 0) return;
		if (COMMAND_TYPES.has(frame.modelEntityType)) this.validateSources(frame, /* @__PURE__ */ new Set([...UI_TYPES, ...PROCESSOR_TYPES]), "command", "ui or processor", accept);
		else if (EVENT_TYPES.has(frame.modelEntityType)) this.validateSources(frame, COMMAND_TYPES, "event", "command", accept);
		else if (READMODEL_TYPES.has(frame.modelEntityType)) this.validateSources(frame, EVENT_TYPES, "read model", "event", accept);
		else if (PROCESSOR_TYPES.has(frame.modelEntityType)) this.validateSources(frame, READMODEL_TYPES, "processor", "read model", accept);
		else if (UI_TYPES.has(frame.modelEntityType)) this.validateSources(frame, READMODEL_TYPES, "ui", "read model", accept);
	}
	validateSources(frame, allowedSourceTypes, targetLabel, expectedSourceLabel, accept) {
		for (const sourceRef of frame.sourceFrames) {
			const source = sourceRef.ref;
			if (source !== void 0 && !allowedSourceTypes.has(source.modelEntityType)) accept("error", `A ${targetLabel} can only receive input from a ${expectedSourceLabel}, not from '${source.modelEntityType}'.`, {
				node: frame,
				property: "sourceFrames"
			});
		}
	}
};
var EventModelingModule = {
	parser: {
		TokenBuilder: /* @__PURE__ */ __name(() => new EventModelingTokenBuilder(), "TokenBuilder"),
		ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
	},
	validation: { EventModelingValidator: /* @__PURE__ */ __name(() => new EventModelingValidator(), "EventModelingValidator") }
};
function createEventModelingServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const EventModel = inject(createDefaultCoreModule({ shared }), EventModelingGeneratedModule, EventModelingModule);
	shared.ServiceRegistry.register(EventModel);
	registerValidationChecks$1(EventModel);
	return {
		shared,
		EventModel
	};
}
__name(createEventModelingServices, "createEventModelingServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-UIBZB4QT.mjs
var GitGraphTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "GitGraphTokenBuilder");
	}
	constructor() {
		super(["gitGraph"]);
	}
};
var GitGraphModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new GitGraphTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
} };
function createGitGraphServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const GitGraph = inject(createDefaultCoreModule({ shared }), GitGraphGrammarGeneratedModule, GitGraphModule);
	shared.ServiceRegistry.register(GitGraph);
	return {
		shared,
		GitGraph
	};
}
__name(createGitGraphServices, "createGitGraphServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-5DO6E6H7.mjs
var InfoTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "InfoTokenBuilder");
	}
	constructor() {
		super(["info", "showInfo"]);
	}
};
var InfoModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new InfoTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
} };
function createInfoServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Info = inject(createDefaultCoreModule({ shared }), InfoGrammarGeneratedModule, InfoModule);
	shared.ServiceRegistry.register(Info);
	return {
		shared,
		Info
	};
}
__name(createInfoServices, "createInfoServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-MPE355IW.mjs
var PacketTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "PacketTokenBuilder");
	}
	constructor() {
		super(["packet"]);
	}
};
var PacketModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new PacketTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
} };
function createPacketServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Packet = inject(createDefaultCoreModule({ shared }), PacketGrammarGeneratedModule, PacketModule);
	shared.ServiceRegistry.register(Packet);
	return {
		shared,
		Packet
	};
}
__name(createPacketServices, "createPacketServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-MZUSXYTE.mjs
var PieTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "PieTokenBuilder");
	}
	constructor() {
		super(["pie", "showData"]);
	}
};
var PieValueConverter = class extends AbstractMermaidValueConverter {
	static {
		__name(this, "PieValueConverter");
	}
	runCustomConverter(rule, input, _cstNode) {
		if (rule.name !== "PIE_SECTION_LABEL") return;
		return input.replace(/"/g, "").trim();
	}
};
var PieModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new PieTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new PieValueConverter(), "ValueConverter")
} };
function createPieServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Pie = inject(createDefaultCoreModule({ shared }), PieGrammarGeneratedModule, PieModule);
	shared.ServiceRegistry.register(Pie);
	return {
		shared,
		Pie
	};
}
__name(createPieServices, "createPieServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-FHYWG6QK.mjs
var RadarTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "RadarTokenBuilder");
	}
	constructor() {
		super(["radar-beta"]);
	}
};
var RadarModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new RadarTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new CommonValueConverter(), "ValueConverter")
} };
function createRadarServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Radar = inject(createDefaultCoreModule({ shared }), RadarGrammarGeneratedModule, RadarModule);
	shared.ServiceRegistry.register(Radar);
	return {
		shared,
		Radar
	};
}
__name(createRadarServices, "createRadarServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-WCWK7LTN.mjs
var TreeViewValueConverter = class extends AbstractMermaidValueConverter {
	static {
		__name(this, "TreeViewValueConverter");
	}
	runCustomConverter(rule, input, _cstNode) {
		if (rule.name === "INDENTATION") return input?.length || 0;
		else if (rule.name === "STRING2") return input.substring(1, input.length - 1);
	}
};
var TreeViewTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "TreeViewTokenBuilder");
	}
	constructor() {
		super(["treeView-beta"]);
	}
};
var TreeViewModule = { parser: {
	TokenBuilder: /* @__PURE__ */ __name(() => new TreeViewTokenBuilder(), "TokenBuilder"),
	ValueConverter: /* @__PURE__ */ __name(() => new TreeViewValueConverter(), "ValueConverter")
} };
function createTreeViewServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const TreeView = inject(createDefaultCoreModule({ shared }), TreeViewGrammarGeneratedModule, TreeViewModule);
	shared.ServiceRegistry.register(TreeView);
	return {
		shared,
		TreeView
	};
}
__name(createTreeViewServices, "createTreeViewServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-BR22UD5L.mjs
var TreemapTokenBuilder = class extends AbstractMermaidTokenBuilder {
	static {
		__name(this, "TreemapTokenBuilder");
	}
	constructor() {
		super(["treemap"]);
	}
};
var classDefRegex = /classDef\s+([A-Z_a-z]\w+)(?:\s+([^\n\r;]*))?;?/;
var TreemapValueConverter = class extends AbstractMermaidValueConverter {
	static {
		__name(this, "TreemapValueConverter");
	}
	runCustomConverter(rule, input, _cstNode) {
		if (rule.name === "NUMBER2") return parseFloat(input.replace(/,/g, ""));
		else if (rule.name === "SEPARATOR") return input.substring(1, input.length - 1);
		else if (rule.name === "STRING2") return input.substring(1, input.length - 1);
		else if (rule.name === "INDENTATION") return input.length;
		else if (rule.name === "ClassDef") {
			if (typeof input !== "string") return input;
			const match = classDefRegex.exec(input);
			if (match) return {
				$type: "ClassDefStatement",
				className: match[1],
				styleText: match[2] || void 0
			};
		}
	}
};
function registerValidationChecks(services) {
	const validator = services.validation.TreemapValidator;
	const registry = services.validation.ValidationRegistry;
	if (registry) {
		const checks = { Treemap: validator.checkSingleRoot.bind(validator) };
		registry.register(checks, validator);
	}
}
__name(registerValidationChecks, "registerValidationChecks");
var TreemapValidator = class {
	static {
		__name(this, "TreemapValidator");
	}
	/**
	* Validates that a treemap has only one root node.
	* A root node is defined as a node that has no indentation.
	*/
	checkSingleRoot(doc, accept) {
		let rootNodeIndentation;
		for (const row of doc.TreemapRows) {
			if (!row.item) continue;
			if (rootNodeIndentation === void 0 && row.indent === void 0) rootNodeIndentation = 0;
			else if (row.indent === void 0) accept("error", "Multiple root nodes are not allowed in a treemap.", {
				node: row,
				property: "item"
			});
			else if (rootNodeIndentation !== void 0 && rootNodeIndentation >= parseInt(row.indent, 10)) accept("error", "Multiple root nodes are not allowed in a treemap.", {
				node: row,
				property: "item"
			});
		}
	}
};
var TreemapModule = {
	parser: {
		TokenBuilder: /* @__PURE__ */ __name(() => new TreemapTokenBuilder(), "TokenBuilder"),
		ValueConverter: /* @__PURE__ */ __name(() => new TreemapValueConverter(), "ValueConverter")
	},
	validation: { TreemapValidator: /* @__PURE__ */ __name(() => new TreemapValidator(), "TreemapValidator") }
};
function createTreemapServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Treemap = inject(createDefaultCoreModule({ shared }), TreemapGrammarGeneratedModule, TreemapModule);
	shared.ServiceRegistry.register(Treemap);
	registerValidationChecks(Treemap);
	return {
		shared,
		Treemap
	};
}
__name(createTreemapServices, "createTreemapServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-PUPMXCY4.mjs
var WardleyValueConverter = class extends AbstractMermaidValueConverter {
	static {
		__name(this, "WardleyValueConverter");
	}
	runCustomConverter(rule, input, _cstNode) {
		switch (rule.name.toUpperCase()) {
			case "LINK_LABEL": return input.substring(1).trim();
			default: return;
		}
	}
};
var WardleyModule = { parser: { ValueConverter: /* @__PURE__ */ __name(() => new WardleyValueConverter(), "ValueConverter") } };
function createWardleyServices(context = EmptyFileSystem) {
	const shared = inject(createDefaultSharedCoreModule(context), MermaidGeneratedSharedModule);
	const Wardley = inject(createDefaultCoreModule({ shared }), WardleyGrammarGeneratedModule, WardleyModule);
	shared.ServiceRegistry.register(Wardley);
	return {
		shared,
		Wardley
	};
}
__name(createWardleyServices, "createWardleyServices");
//#endregion
//#region node_modules/@mermaid-js/parser/dist/mermaid-parser.core.mjs
var parsers = {};
var initializers = {
	info: /* @__PURE__ */ __name(async () => {
		const { createInfoServices: createInfoServices2 } = await import("./info-J43DQDTF-Coxt__mH.js");
		parsers.info = createInfoServices2().Info.parser.LangiumParser;
	}, "info"),
	packet: /* @__PURE__ */ __name(async () => {
		const { createPacketServices: createPacketServices2 } = await import("./packet-YPE3B663-Rv3b08z1.js");
		parsers.packet = createPacketServices2().Packet.parser.LangiumParser;
	}, "packet"),
	pie: /* @__PURE__ */ __name(async () => {
		const { createPieServices: createPieServices2 } = await import("./pie-LRSECV5Y-C-UwPDZG.js");
		parsers.pie = createPieServices2().Pie.parser.LangiumParser;
	}, "pie"),
	treeView: /* @__PURE__ */ __name(async () => {
		const { createTreeViewServices: createTreeViewServices2 } = await import("./treeView-BLDUP644-D27k5Xcy.js");
		parsers.treeView = createTreeViewServices2().TreeView.parser.LangiumParser;
	}, "treeView"),
	architecture: /* @__PURE__ */ __name(async () => {
		const { createArchitectureServices: createArchitectureServices2 } = await import("./architecture-7EHR7CIX-DkuVgOXX.js");
		parsers.architecture = createArchitectureServices2().Architecture.parser.LangiumParser;
	}, "architecture"),
	gitGraph: /* @__PURE__ */ __name(async () => {
		const { createGitGraphServices: createGitGraphServices2 } = await import("./gitGraph-WXDBUCRP-E2uz7EG2.js");
		parsers.gitGraph = createGitGraphServices2().GitGraph.parser.LangiumParser;
	}, "gitGraph"),
	eventmodeling: /* @__PURE__ */ __name(async () => {
		const { createEventModelingServices: createEventModelingServices2 } = await import("./eventmodeling-FCH6USID-B5mlPBTj.js");
		parsers.eventmodeling = createEventModelingServices2().EventModel.parser.LangiumParser;
	}, "eventmodeling"),
	radar: /* @__PURE__ */ __name(async () => {
		const { createRadarServices: createRadarServices2 } = await import("./radar-GUYGQ44K-DWPeAKkK.js");
		parsers.radar = createRadarServices2().Radar.parser.LangiumParser;
	}, "radar"),
	treemap: /* @__PURE__ */ __name(async () => {
		const { createTreemapServices: createTreemapServices2 } = await import("./treemap-LRROVOQU-VCszU5N6.js");
		parsers.treemap = createTreemapServices2().Treemap.parser.LangiumParser;
	}, "treemap"),
	wardley: /* @__PURE__ */ __name(async () => {
		const { createWardleyServices: createWardleyServices2 } = await import("./wardley-L42UT6IY-BxMbctCf.js");
		parsers.wardley = createWardleyServices2().Wardley.parser.LangiumParser;
	}, "wardley")
};
async function parse(diagramType, text) {
	const initializer = initializers[diagramType];
	if (!initializer) throw new Error(`Unknown diagram type: ${diagramType}`);
	if (!parsers[diagramType]) await initializer();
	const result = parsers[diagramType].parse(text);
	if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) throw new MermaidParseError(result);
	return result.value;
}
__name(parse, "parse");
var MermaidParseError = class extends Error {
	constructor(result) {
		const lexerErrors = result.lexerErrors.map((err) => {
			return `Lexer error on line ${err.line !== void 0 && !isNaN(err.line) ? err.line : "?"}, column ${err.column !== void 0 && !isNaN(err.column) ? err.column : "?"}: ${err.message}`;
		}).join("\n");
		const parserErrors = result.parserErrors.map((err) => {
			return `Parse error on line ${err.token.startLine !== void 0 && !isNaN(err.token.startLine) ? err.token.startLine : "?"}, column ${err.token.startColumn !== void 0 && !isNaN(err.token.startColumn) ? err.token.startColumn : "?"}: ${err.message}`;
		}).join("\n");
		super(`Parsing failed: ${lexerErrors} ${parserErrors}`);
		this.result = result;
	}
	static {
		__name(this, "MermaidParseError");
	}
};
//#endregion
export { createGitGraphServices as _, createTreemapServices as a, ArchitectureModule as b, RadarModule as c, createPieServices as d, PacketModule as f, GitGraphModule as g, createInfoServices as h, TreemapModule as i, createRadarServices as l, InfoModule as m, WardleyModule as n, TreeViewModule as o, createPacketServices as p, createWardleyServices as r, createTreeViewServices as s, parse as t, PieModule as u, EventModelingModule as v, createArchitectureServices as x, createEventModelingServices as y };

//# sourceMappingURL=mermaid-parser.core-COAgKAZM.js.map