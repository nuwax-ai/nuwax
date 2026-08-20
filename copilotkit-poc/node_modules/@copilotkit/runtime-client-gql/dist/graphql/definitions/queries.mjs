import { graphql } from "../@generated/gql.mjs";

//#region src/graphql/definitions/queries.ts
const getAvailableAgentsQuery = graphql(
	/** GraphQL **/
	`
  query availableAgents {
    availableAgents {
      agents {
        name
        id
        description
      }
    }
  }
`
);
const loadAgentStateQuery = graphql(
	/** GraphQL **/
	`
  query loadAgentState($data: LoadAgentStateInput!) {
    loadAgentState(data: $data) {
      threadId
      threadExists
      state
      messages
    }
  }
`
);

//#endregion
export { getAvailableAgentsQuery, loadAgentStateQuery };
//# sourceMappingURL=queries.mjs.map