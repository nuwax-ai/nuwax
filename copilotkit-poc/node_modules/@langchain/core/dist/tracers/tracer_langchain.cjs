Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_runtime = require("../_virtual/_rolldown/runtime.cjs");
const require_metadata = require("../messages/metadata.cjs");
const require_ai = require("../messages/ai.cjs");
const require_tracers_base = require("./base.cjs");
const require_tracer = require("../singletons/tracer.cjs");
let langsmith_run_trees = require("langsmith/run_trees");
let langsmith = require("langsmith");
let langsmith_singletons_traceable = require("langsmith/singletons/traceable");
//#region src/tracers/tracer_langchain.ts
var tracer_langchain_exports = /* @__PURE__ */ require_runtime.__exportAll({
	LangChainTracer: () => LangChainTracer,
	OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS: () => OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS
});
/**
* Keys that should be inherited from `tracerInheritableMetadata` even when
* the run already has a value for them. This lets nested contexts
* (e.g. a subagent invoked from inside a parent agent) override a
* LangSmith-only tracing metadata value that was set by an ancestor.
*
* Keep this list very small: every key here loses the default
* "first wins" protection and is always clobbered by the nearest
* enclosing tracer config. Only keys that are strictly for LangSmith
* tracing bookkeeping should be added.
*/
const OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS = new Set(["ls_agent_type"]);
/**
* Extract usage_metadata from chat generations.
*
* Iterates through generations to find and aggregates all usage_metadata
* found in chat messages. This is typically present in chat model outputs.
*/
function _getUsageMetadataFromGenerations(generations) {
	let output = void 0;
	for (const generationBatch of generations) for (const generation of generationBatch) if (require_ai.AIMessage.isInstance(generation.message) && generation.message.usage_metadata !== void 0) output = require_metadata.mergeUsageMetadata(output, generation.message.usage_metadata);
	return output;
}
var LangChainTracer = class LangChainTracer extends require_tracers_base.BaseTracer {
	name = "langchain_tracer";
	projectName;
	exampleId;
	client;
	replicas;
	usesRunTreeMap = true;
	tracingMetadata;
	tracingTags = [];
	constructor(fields = {}) {
		super(fields);
		this.fields = fields;
		const { exampleId, projectName, client, replicas, metadata, tags } = fields;
		this.projectName = projectName ?? (0, langsmith.getDefaultProjectName)();
		this.replicas = replicas;
		this.exampleId = exampleId;
		this.client = client ?? require_tracer.getDefaultLangChainClientSingleton();
		this.tracingMetadata = metadata ? { ...metadata } : void 0;
		this.tracingTags = tags ?? [];
		const traceableTree = LangChainTracer.getTraceableRunTree();
		if (traceableTree) this.updateFromRunTree(traceableTree);
	}
	async persistRun(_run) {}
	async onRunCreate(run) {
		_patchMissingTracingDefaults(this, run);
		if (!run.extra?.lc_defers_inputs) await this.getRunTreeWithTracingConfig(run.id)?.postRun();
	}
	async onRunUpdate(run) {
		_patchMissingTracingDefaults(this, run);
		const runTree = this.getRunTreeWithTracingConfig(run.id);
		if (run.extra?.lc_defers_inputs) await runTree?.postRun();
		else await runTree?.patchRun();
	}
	onLLMEnd(run) {
		const outputs = run.outputs;
		if (outputs?.generations) {
			const usageMetadata = _getUsageMetadataFromGenerations(outputs.generations);
			if (usageMetadata !== void 0) {
				run.extra = run.extra ?? {};
				const metadata = run.extra.metadata ?? {};
				metadata.usage_metadata = usageMetadata;
				run.extra.metadata = metadata;
			}
		}
	}
	copyWithTracingConfig({ metadata, tags }) {
		let mergedMetadata;
		if (metadata === void 0) mergedMetadata = this.tracingMetadata ? { ...this.tracingMetadata } : void 0;
		else if (this.tracingMetadata === void 0) mergedMetadata = { ...metadata };
		else {
			mergedMetadata = { ...this.tracingMetadata };
			for (const [key, value] of Object.entries(metadata)) if (!Object.prototype.hasOwnProperty.call(mergedMetadata, key) || OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS.has(key)) mergedMetadata[key] = value;
		}
		const mergedTags = tags ? Array.from(new Set([...this.tracingTags, ...tags])) : [...this.tracingTags];
		const copied = new LangChainTracer({
			...this.fields,
			metadata: mergedMetadata,
			tags: mergedTags
		});
		copied.runMap = this.runMap;
		copied.runTreeMap = this.runTreeMap;
		return copied;
	}
	getRun(id) {
		return this.runTreeMap.get(id);
	}
	updateFromRunTree(runTree) {
		this.runTreeMap.set(runTree.id, runTree);
		let rootRun = runTree;
		const visited = /* @__PURE__ */ new Set();
		while (rootRun.parent_run) {
			if (visited.has(rootRun.id)) break;
			visited.add(rootRun.id);
			if (!rootRun.parent_run) break;
			rootRun = rootRun.parent_run;
		}
		visited.clear();
		const queue = [rootRun];
		while (queue.length > 0) {
			const current = queue.shift();
			if (!current || visited.has(current.id)) continue;
			visited.add(current.id);
			this.runTreeMap.set(current.id, current);
			if (current.child_runs) queue.push(...current.child_runs);
		}
		this.client = runTree.client ?? this.client;
		this.replicas = runTree.replicas ?? this.replicas;
		this.projectName = runTree.project_name ?? this.projectName;
		this.exampleId = runTree.reference_example_id ?? this.exampleId;
		this.fields = {
			...this.fields,
			client: this.client,
			replicas: this.replicas,
			projectName: this.projectName,
			exampleId: this.exampleId
		};
	}
	getRunTreeWithTracingConfig(id) {
		const runTree = this.runTreeMap.get(id);
		if (!runTree) return void 0;
		return new langsmith_run_trees.RunTree({
			...runTree,
			client: this.client,
			project_name: this.projectName,
			replicas: this.replicas,
			reference_example_id: this.exampleId,
			tracingEnabled: true
		});
	}
	static getTraceableRunTree() {
		try {
			return (0, langsmith_singletons_traceable.getCurrentRunTree)(true);
		} catch {
			return;
		}
	}
	static [Symbol.hasInstance](instance) {
		if (typeof instance !== "object" || instance === null) return false;
		const candidate = instance;
		return "name" in candidate && candidate.name === "langchain_tracer" && "copyWithTracingConfig" in candidate && typeof candidate.copyWithTracingConfig === "function" && "getRunTreeWithTracingConfig" in candidate && typeof candidate.getRunTreeWithTracingConfig === "function";
	}
};
function _patchMissingTracingDefaults(tracer, run) {
	if (tracer.tracingMetadata) {
		run.extra ??= {};
		const metadata = run.extra.metadata ?? {};
		let didPatchMetadata = false;
		for (const [key, value] of Object.entries(tracer.tracingMetadata)) if (!Object.prototype.hasOwnProperty.call(metadata, key) || OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS.has(key)) {
			if (metadata[key] !== value) {
				metadata[key] = value;
				didPatchMetadata = true;
			}
		}
		if (didPatchMetadata) run.extra.metadata = metadata;
	}
	if (tracer.tracingTags.length > 0) run.tags = Array.from(new Set([...run.tags ?? [], ...tracer.tracingTags]));
}
//#endregion
exports.LangChainTracer = LangChainTracer;
exports.OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS = OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS;
Object.defineProperty(exports, "tracer_langchain_exports", {
	enumerable: true,
	get: function() {
		return tracer_langchain_exports;
	}
});

//# sourceMappingURL=tracer_langchain.cjs.map