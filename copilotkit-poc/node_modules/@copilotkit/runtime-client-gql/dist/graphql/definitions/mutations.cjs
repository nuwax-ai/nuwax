const require_gql = require('../@generated/gql.cjs');

//#region src/graphql/definitions/mutations.ts
const generateCopilotResponseMutation = require_gql.graphql(
	/** GraphQL **/
	`
  mutation generateCopilotResponse(
    $data: GenerateCopilotResponseInput!
    $properties: JSONObject
  ) {
    generateCopilotResponse(data: $data, properties: $properties) {
      threadId
      runId
      extensions {
        openaiAssistantAPI {
          runId
          threadId
        }
      }
      ... on CopilotResponse @defer {
        status {
          ... on BaseResponseStatus {
            code
          }
          ... on FailedResponseStatus {
            reason
            details
          }
        }
      }
      messages @stream {
        __typename
        ... on BaseMessageOutput {
          id
          createdAt
        }
        ... on BaseMessageOutput @defer {
          status {
            ... on SuccessMessageStatus {
              code
            }
            ... on FailedMessageStatus {
              code
              reason
            }
            ... on PendingMessageStatus {
              code
            }
          }
        }
        ... on TextMessageOutput {
          content @stream
          role
          parentMessageId
        }
        ... on ImageMessageOutput {
          format
          bytes
          role
          parentMessageId
        }
        ... on ActionExecutionMessageOutput {
          name
          arguments @stream
          parentMessageId
        }
        ... on ResultMessageOutput {
          result
          actionExecutionId
          actionName
        }
        ... on AgentStateMessageOutput {
          threadId
          state
          running
          agentName
          nodeName
          runId
          active
          role
        }
      }
      metaEvents @stream {
        ... on LangGraphInterruptEvent {
          type
          name
          value
        }

        ... on CopilotKitLangGraphInterruptEvent {
          type
          name
          data {
            messages {
              __typename
              ... on BaseMessageOutput {
                id
                createdAt
              }
              ... on BaseMessageOutput @defer {
                status {
                  ... on SuccessMessageStatus {
                    code
                  }
                  ... on FailedMessageStatus {
                    code
                    reason
                  }
                  ... on PendingMessageStatus {
                    code
                  }
                }
              }
              ... on TextMessageOutput {
                content
                role
                parentMessageId
              }
              ... on ActionExecutionMessageOutput {
                name
                arguments
                parentMessageId
              }
              ... on ResultMessageOutput {
                result
                actionExecutionId
                actionName
              }
            }
            value
          }
        }
      }
    }
  }
`
);

//#endregion
exports.generateCopilotResponseMutation = generateCopilotResponseMutation;
//# sourceMappingURL=mutations.cjs.map