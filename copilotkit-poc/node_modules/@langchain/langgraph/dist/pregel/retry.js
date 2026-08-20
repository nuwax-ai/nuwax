import { CONFIG_KEY_RESUMING, Command } from "../constants.js";
import { isGraphBubbleUp, isParentCommand } from "../errors.js";
import { getParentCheckpointNamespace } from "./utils/config.js";
import { patchConfigurable } from "./utils/index.js";
import { runAttemptWithTimeout } from "./timeout.js";
const DEFAULT_STATUS_NO_RETRY = [
	400,
	401,
	402,
	403,
	404,
	405,
	406,
	407,
	409
];
const DEFAULT_RETRY_ON_HANDLER = (error) => {
	if (error.message.startsWith("Cancel") || error.message.startsWith("AbortError") || error.name === "AbortError") return false;
	if (error.name === "GraphValueError") return false;
	if (error?.code === "ECONNABORTED") return false;
	const status = error?.response?.status ?? error?.status;
	if (status && DEFAULT_STATUS_NO_RETRY.includes(+status)) return false;
	if (error?.error?.code === "insufficient_quota") return false;
	return true;
};
async function _runWithRetry(pregelTask, retryPolicy, configurable, signal) {
	const resolvedRetryPolicy = pregelTask.retry_policy ?? retryPolicy;
	let attempts = 0;
	let error;
	let result;
	let config = pregelTask.config ?? {};
	if (configurable) config = patchConfigurable(config, configurable);
	config = {
		...config,
		signal
	};
	const firstAttemptTime = Date.now();
	if (config.executionInfo != null) config.executionInfo = {
		...config.executionInfo,
		nodeFirstAttemptTime: firstAttemptTime
	};
	while (true) {
		if (signal?.aborted) break;
		pregelTask.writes.splice(0, pregelTask.writes.length);
		error = void 0;
		try {
			if (pregelTask.timeout !== void 0) result = await runAttemptWithTimeout(pregelTask, config, pregelTask.timeout, (scopedConfig) => pregelTask.proc.invoke(pregelTask.input, scopedConfig));
			else result = await pregelTask.proc.invoke(pregelTask.input, config);
			break;
		} catch (e) {
			error = e;
			error.pregelTaskId = pregelTask.id;
			if (isParentCommand(error)) {
				const ns = config?.configurable?.checkpoint_ns;
				const cmd = error.command;
				if (cmd.graph === ns) {
					for (const writer of pregelTask.writers) await writer.invoke(cmd, config);
					error = void 0;
					break;
				} else if (cmd.graph === Command.PARENT) {
					const parentNs = getParentCheckpointNamespace(ns);
					error.command = new Command({
						...error.command,
						graph: parentNs
					});
				}
			}
			if (isGraphBubbleUp(error)) break;
			if (resolvedRetryPolicy === void 0) break;
			attempts += 1;
			if (attempts >= (resolvedRetryPolicy.maxAttempts ?? 3)) break;
			if (!(resolvedRetryPolicy.retryOn ?? DEFAULT_RETRY_ON_HANDLER)(error)) break;
			const initialInterval = resolvedRetryPolicy.initialInterval ?? 500;
			const interval = Math.min(resolvedRetryPolicy.maxInterval ?? 128e3, initialInterval * (resolvedRetryPolicy.backoffFactor ?? 2) ** (attempts - 1));
			const sleepMs = resolvedRetryPolicy.jitter ?? true ? interval + Math.random() * 1e3 : interval;
			await new Promise((resolve) => setTimeout(resolve, sleepMs));
			const errorName = error.name ?? error.constructor.unminifiable_name ?? error.constructor.name;
			if (resolvedRetryPolicy?.logWarning ?? true) console.log(`Retrying task "${String(pregelTask.name)}" after ${sleepMs.toFixed(2)}ms (attempt ${attempts}) after ${errorName}: ${error}`);
			config = patchConfigurable(config, { [CONFIG_KEY_RESUMING]: true });
			if (config.executionInfo != null) config.executionInfo = {
				...config.executionInfo,
				nodeAttempt: attempts + 1,
				nodeFirstAttemptTime: firstAttemptTime
			};
		}
	}
	return {
		task: pregelTask,
		result,
		error,
		signalAborted: signal?.aborted
	};
}
//#endregion
export { _runWithRetry };

//# sourceMappingURL=retry.js.map