//#region src/types/copilot-cloud-config.d.ts
interface CopilotCloudConfig {
  guardrails: {
    input: {
      restrictToTopic: {
        enabled: boolean;
        validTopics: string[];
        invalidTopics: string[];
      };
    };
  };
}
//#endregion
export { CopilotCloudConfig };
//# sourceMappingURL=copilot-cloud-config.d.mts.map