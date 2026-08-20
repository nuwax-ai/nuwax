import { BaseCallbackHandlerInput } from "../callbacks/base.js";
import { BaseTracer, Run as Run$2 } from "./base.js";
import { RunTree, RunTreeConfig } from "langsmith/run_trees";
import { LangSmithTracingClientInterface } from "langsmith";
import { BaseRun, KVMap, RunCreate, RunUpdate as RunUpdate$1 } from "langsmith/schemas";

//#region src/tracers/tracer_langchain.d.ts
interface Run extends BaseRun {
  id: string;
  child_runs: this[];
  child_execution_order: number;
  dotted_order?: string;
  trace_id?: string;
}
interface RunCreate2 extends RunCreate {
  trace_id?: string;
  dotted_order?: string;
}
interface RunUpdate extends RunUpdate$1 {
  events: BaseRun["events"];
  inputs: KVMap;
  trace_id?: string;
  dotted_order?: string;
}
interface LangChainTracerFields extends BaseCallbackHandlerInput {
  exampleId?: string;
  projectName?: string;
  client?: LangSmithTracingClientInterface;
  replicas?: RunTreeConfig["replicas"];
  metadata?: Record<string, unknown>;
  tags?: string[];
}
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
declare const OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS: Set<string>;
declare class LangChainTracer extends BaseTracer implements LangChainTracerFields {
  protected fields: LangChainTracerFields;
  name: string;
  projectName?: string;
  exampleId?: string;
  client: LangSmithTracingClientInterface;
  replicas?: RunTreeConfig["replicas"];
  usesRunTreeMap: boolean;
  tracingMetadata?: Record<string, unknown>;
  tracingTags: string[];
  constructor(fields?: LangChainTracerFields);
  protected persistRun(_run: Run): Promise<void>;
  onRunCreate(run: Run): Promise<void>;
  onRunUpdate(run: Run): Promise<void>;
  onLLMEnd(run: Run$2): void;
  copyWithTracingConfig({
    metadata,
    tags
  }: {
    metadata?: Record<string, unknown>;
    tags?: string[];
  }): LangChainTracer;
  getRun(id: string): Run | undefined;
  updateFromRunTree(runTree: RunTree): void;
  getRunTreeWithTracingConfig(id: string): RunTree | undefined;
  static getTraceableRunTree(): RunTree | undefined;
  static [Symbol.hasInstance](instance: unknown): boolean;
}
//#endregion
export { LangChainTracer, LangChainTracerFields, OVERRIDABLE_LANGSMITH_INHERITABLE_METADATA_KEYS, Run, RunCreate2, RunUpdate };
//# sourceMappingURL=tracer_langchain.d.ts.map