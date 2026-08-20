//#region src/types/openai-assistant.d.ts
interface FunctionDefinition {
  /**
   * The name of the function to be called. Must be a-z, A-Z, 0-9, or contain
   * underscores and dashes, with a maximum length of 64.
   */
  name: string;
  /**
   * The parameters the functions accepts, described as a JSON Schema object. See the
   * [guide](/docs/guides/gpt/function-calling) for examples, and the
   * [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for
   * documentation about the format.
   *
   * To describe a function that accepts no parameters, provide the value
   * `{"type": "object", "properties": {}}`.
   */
  parameters: Record<string, unknown>;
  /**
   * A description of what the function does, used by the model to choose when and
   * how to call the function.
   */
  description?: string;
}
interface ToolDefinition {
  type: "function";
  function: FunctionDefinition;
}
interface FunctionCallHandlerArguments {
  messages: any[];
  name: string;
  args: any;
}
type FunctionCallHandler = (args: FunctionCallHandlerArguments) => Promise<any>;
type CoAgentStateRenderHandlerArguments = {
  name: string;
  nodeName: string;
  state: any;
};
type CoAgentStateRenderHandler = (args: CoAgentStateRenderHandlerArguments) => Promise<any>;
type AssistantMessage = {
  id: string;
  role: "assistant";
  content: Array<{
    type: "text";
    text: {
      value: string;
    };
  }>;
};
type JSONValue = null | string | number | boolean | {
  [x: string]: JSONValue;
} | Array<JSONValue>;
//#endregion
export { AssistantMessage, CoAgentStateRenderHandler, CoAgentStateRenderHandlerArguments, FunctionCallHandler, FunctionCallHandlerArguments, FunctionDefinition, JSONValue, ToolDefinition };
//# sourceMappingURL=openai-assistant.d.cts.map