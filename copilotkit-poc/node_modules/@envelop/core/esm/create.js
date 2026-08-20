import { getInstrumented } from '@envelop/instrumentation';
import { createEnvelopOrchestrator } from './orchestrator.js';
function notEmpty(value) {
    return value != null;
}
export function envelop(options) {
    const plugins = options.plugins.filter(notEmpty);
    const orchestrator = createEnvelopOrchestrator({
        plugins,
    });
    const instrumentation = orchestrator.instrumentation;
    const getEnveloped = (context = {}) => {
        const instrumented = getInstrumented({ context });
        const typedOrchestrator = orchestrator;
        instrumented.fn(instrumentation?.init, orchestrator.init)(context);
        return {
            parse: instrumented.fn(instrumentation?.parse, typedOrchestrator.parse(context)),
            validate: instrumented.fn(instrumentation?.validate, typedOrchestrator.validate(context)),
            contextFactory: instrumented.fn(instrumentation?.context, typedOrchestrator.contextFactory(context)),
            execute: instrumented.asyncFn(instrumentation?.execute, typedOrchestrator.execute),
            subscribe: instrumented.asyncFn(instrumentation?.subscribe, typedOrchestrator.subscribe),
            schema: typedOrchestrator.getCurrentSchema(),
        };
    };
    getEnveloped._plugins = plugins;
    return getEnveloped;
}
