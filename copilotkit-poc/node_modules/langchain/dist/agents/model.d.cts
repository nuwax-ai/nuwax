import { BaseLanguageModelInput, LanguageModelOutput } from "@langchain/core/language_models/base";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { RunnableInterface } from "@langchain/core/runnables";

//#region src/agents/model.d.ts
type AgentLanguageModelLike = RunnableInterface<BaseLanguageModelInput, LanguageModelOutput>;
//#endregion
export { AgentLanguageModelLike };
//# sourceMappingURL=model.d.cts.map