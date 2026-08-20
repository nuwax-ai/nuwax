import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { InferInteropZodInput, InferInteropZodOutput, InteropZodObject } from "@langchain/core/utils/types";

//#region src/tools/headless.d.ts
/**
 * Configuration fields for creating a headless tool.
 */
type HeadlessToolFields<SchemaT extends InteropZodObject, NameT extends string = string> = {
  /** The name of the tool. Used by the client to match implementations. */name: NameT; /** Description of what the tool does. */
  description: string; /** The Zod schema defining the tool's input. */
  schema: SchemaT;
};
/**
 * A tool implementation that pairs a headless tool with its execution function.
 *
 * Created by calling `.implement()` on a {@link HeadlessTool}.
 * Pass to `useStream({ tools: [...] })` on the client side.
 */
type HeadlessToolImplementation<SchemaT extends InteropZodObject = InteropZodObject, OutputT = unknown, NameT extends string = string> = {
  tool: HeadlessTool<SchemaT, NameT>;
  execute: (args: InferInteropZodOutput<SchemaT>) => Promise<OutputT>;
};
/**
 * A headless tool that always interrupts agent execution on the server.
 *
 * The implementation is provided separately on the client via
 * `useStream({ tools: [...] })` using `.implement()`.
 */
type HeadlessTool<SchemaT extends InteropZodObject = InteropZodObject, NameT extends string = string> = DynamicStructuredTool<SchemaT, InferInteropZodOutput<SchemaT>, InferInteropZodInput<SchemaT>, unknown, unknown, NameT> & {
  /**
   * Pairs this headless tool with a client-side implementation.
   *
   * The returned object should be passed to `useStream({ tools: [...] })`.
   * The SDK matches the implementation to the tool by name and calls
   * `execute` with the typed arguments from the interrupt payload.
   *
   * @param execute - The function that implements the tool on the client
   */
  implement: <OutputT>(execute: (args: InferInteropZodOutput<SchemaT>) => Promise<OutputT>) => HeadlessToolImplementation<SchemaT, OutputT, NameT>;
};
/**
 * The headless overload signature added to the core `tool` function.
 *
 * When called **without** an implementation function — just `tool({ name, description, schema })` —
 * returns a {@link HeadlessTool} that interrupts on every agent invocation.
 * The client provides the implementation via `useStream({ tools: [...] })`.
 */
type HeadlessToolOverload = {
  <SchemaT extends InteropZodObject, NameT extends string>(fields: HeadlessToolFields<SchemaT, NameT>): HeadlessTool<SchemaT, NameT>;
};
/**
 * Unified tool primitive for LangChain agents.
 *
 * Enhances the `tool` function from `@langchain/core/tools` with a headless
 * overload: when called **without** an implementation function, the tool
 * interrupts agent execution and lets the client supply the implementation.
 *
 * ---
 *
 * **Normal tool** — pass an implementation function as the first argument:
 *
 * ```typescript
 * import { tool } from "langchain/tools";
 * import { z } from "zod";
 *
 * const getWeather = tool(
 *   async ({ city }) => `The weather in ${city} is sunny.`,
 *   {
 *     name: "get_weather",
 *     description: "Get the weather for a city",
 *     schema: z.object({ city: z.string() }),
 *   }
 * );
 * ```
 *
 * ---
 *
 * **Headless tool** — omit the implementation; the client provides it later:
 *
 * ```typescript
 * import { tool } from "langchain/tools";
 * import { z } from "zod";
 *
 * // Server: define the tool shape — no implementation needed
 * export const getLocation = tool({
 *   name: "get_location",
 *   description: "Get the user's current GPS location",
 *   schema: z.object({
 *     highAccuracy: z.boolean().optional().describe("Request high accuracy GPS"),
 *   }),
 * });
 *
 * // Server: register with the agent
 * const agent = createAgent({
 *   model: "openai:gpt-4o",
 *   tools: [getLocation],
 * });
 *
 * // Client: provide the implementation in useStream
 * const stream = useStream({
 *   assistantId: "agent",
 *   tools: [
 *     getLocation.implement(async ({ highAccuracy }) => {
 *       return new Promise((resolve, reject) => {
 *         navigator.geolocation.getCurrentPosition(
 *           (pos) => resolve({
 *             latitude: pos.coords.latitude,
 *             longitude: pos.coords.longitude,
 *           }),
 *           (err) => reject(new Error(err.message)),
 *           { enableHighAccuracy: highAccuracy }
 *         );
 *       });
 *     }),
 *   ],
 * });
 * ```
 */
declare const tool$1: HeadlessToolOverload & typeof tool;
//#endregion
export { HeadlessTool, HeadlessToolFields, HeadlessToolImplementation, tool$1 as tool };
//# sourceMappingURL=headless.d.cts.map