const require_runtime = require('../_virtual/_rolldown/runtime.cjs');
const require_package = require('../package.cjs');
const require_mutations = require('../graphql/definitions/mutations.cjs');
const require_queries = require('../graphql/definitions/queries.cjs');
let _urql_core = require("@urql/core");
let _copilotkit_shared = require("@copilotkit/shared");

//#region src/client/CopilotRuntimeClient.ts
const createFetchFn = (signal, handleGQLWarning) => async (...args) => {
	const publicApiKey = args[1]?.headers?.["x-copilotcloud-public-api-key"];
	try {
		const result = await fetch(args[0], {
			...args[1],
			signal
		});
		const mismatch = publicApiKey ? null : await (0, _copilotkit_shared.getPossibleVersionMismatch)({
			runtimeVersion: result.headers.get("X-CopilotKit-Runtime-Version"),
			runtimeClientGqlVersion: require_package.version
		});
		if (result.status !== 200) {
			if (result.status >= 400 && result.status <= 500) {
				if (mismatch) throw new _copilotkit_shared.CopilotKitVersionMismatchError(mismatch);
				throw new _copilotkit_shared.ResolvedCopilotKitError({ status: result.status });
			}
		}
		if (mismatch && handleGQLWarning) handleGQLWarning(mismatch.message);
		return result;
	} catch (error) {
		if (error.message.includes("BodyStreamBuffer was aborted") || error.message.includes("signal is aborted without reason")) throw error;
		if (error instanceof _copilotkit_shared.CopilotKitError) throw error;
		throw new _copilotkit_shared.CopilotKitLowLevelError({
			error,
			url: args[0]
		});
	}
};
var CopilotRuntimeClient = class CopilotRuntimeClient {
	constructor(options) {
		const headers = {};
		this.handleGQLErrors = options.handleGQLErrors;
		this.handleGQLWarning = options.handleGQLWarning;
		if (options.headers) Object.assign(headers, options.headers);
		if (options.publicApiKey) headers["x-copilotcloud-public-api-key"] = options.publicApiKey;
		this.client = new _urql_core.Client({
			url: options.url,
			exchanges: [_urql_core.cacheExchange, _urql_core.fetchExchange],
			fetchOptions: {
				headers: {
					...headers,
					"X-CopilotKit-Runtime-Client-GQL-Version": require_package.version
				},
				...options.credentials ? { credentials: options.credentials } : {}
			}
		});
	}
	generateCopilotResponse({ data, properties, signal }) {
		const fetchFn = createFetchFn(signal, this.handleGQLWarning);
		return this.client.mutation(require_mutations.generateCopilotResponseMutation, {
			data,
			properties
		}, { fetch: fetchFn });
	}
	asStream(source) {
		const handleGQLErrors = this.handleGQLErrors;
		return new ReadableStream({ start(controller) {
			source.subscribe(({ data, hasNext, error }) => {
				if (error) {
					if (error.message.includes("BodyStreamBuffer was aborted") || error.message.includes("signal is aborted without reason")) {
						if (!hasNext) controller.close();
						console.warn("Abort error suppressed");
						return;
					}
					if (error.extensions?.visibility) {
						const syntheticError = {
							...error,
							graphQLErrors: [{
								message: error.message,
								extensions: error.extensions
							}]
						};
						if (handleGQLErrors) handleGQLErrors(syntheticError);
						return;
					}
					controller.error(error);
					if (handleGQLErrors) handleGQLErrors(error);
				} else {
					controller.enqueue(data);
					if (!hasNext) controller.close();
				}
			});
		} });
	}
	availableAgents() {
		const fetchFn = createFetchFn();
		return this.client.query(require_queries.getAvailableAgentsQuery, {}, { fetch: fetchFn });
	}
	loadAgentState(data) {
		const fetchFn = createFetchFn();
		const result = this.client.query(require_queries.loadAgentStateQuery, { data }, { fetch: fetchFn });
		result.toPromise().then(({ error }) => {
			if (error && this.handleGQLErrors) this.handleGQLErrors(error);
		}).catch(() => {});
		return result;
	}
	static removeGraphQLTypename(data) {
		if (Array.isArray(data)) data.forEach((item) => CopilotRuntimeClient.removeGraphQLTypename(item));
		else if (typeof data === "object" && data !== null) {
			delete data.__typename;
			Object.keys(data).forEach((key) => {
				if (typeof data[key] === "object" && data[key] !== null) CopilotRuntimeClient.removeGraphQLTypename(data[key]);
			});
		}
		return data;
	}
};

//#endregion
exports.CopilotRuntimeClient = CopilotRuntimeClient;
//# sourceMappingURL=CopilotRuntimeClient.cjs.map