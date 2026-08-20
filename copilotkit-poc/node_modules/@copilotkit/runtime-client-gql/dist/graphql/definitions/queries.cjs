const require_gql = require('../@generated/gql.cjs');

//#region src/graphql/definitions/queries.ts
const getAvailableAgentsQuery = require_gql.graphql(
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
const loadAgentStateQuery = require_gql.graphql(
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
exports.getAvailableAgentsQuery = getAvailableAgentsQuery;
exports.loadAgentStateQuery = loadAgentStateQuery;
//# sourceMappingURL=queries.cjs.map