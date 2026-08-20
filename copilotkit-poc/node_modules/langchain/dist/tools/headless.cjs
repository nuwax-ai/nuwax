require("../_virtual/_rolldown/runtime.cjs");
let _langchain_core_tools = require("@langchain/core/tools");
//#region src/tools/headless.ts
/**
* Unified Tool Primitive for LangChain Agents
*
* This module re-exports the `tool` primitive from `@langchain/core/tools` with
* an additional overload: when called without an implementation function, it
* creates a **headless tool** that interrupts agent execution and delegates the
* implementation to the client (e.g. via `useStream({ tools: [...] })`).
*
* @module
*/
function createHeadlessTool(fields) {
	const { name, description, schema } = fields;
	const wrappedTool = (0, _langchain_core_tools.tool)(async (args, config) => {
		const { interrupt } = await import("@langchain/langgraph");
		return interrupt({
			type: "tool",
			toolCall: {
				id: config?.toolCall?.id,
				name,
				args
			}
		});
	}, {
		name,
		description,
		schema,
		metadata: { headlessTool: true }
	});
	const headlessTool = Object.assign(wrappedTool, { implement: (execute) => ({
		tool: headlessTool,
		execute
	}) });
	return headlessTool;
}
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
const tool = ((funcOrFields, fields) => {
	if (typeof funcOrFields !== "function") return createHeadlessTool(funcOrFields);
	return (0, _langchain_core_tools.tool)(funcOrFields, fields);
});
//#endregion
exports.tool = tool;

//# sourceMappingURL=headless.cjs.map