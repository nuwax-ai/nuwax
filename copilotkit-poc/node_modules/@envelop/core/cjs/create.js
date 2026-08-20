"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envelop = envelop;
const instrumentation_1 = require("@envelop/instrumentation");
const orchestrator_js_1 = require("./orchestrator.js");
function notEmpty(value) {
    return value != null;
}
function envelop(options) {
    const plugins = options.plugins.filter(notEmpty);
    const orchestrator = (0, orchestrator_js_1.createEnvelopOrchestrator)({
        plugins,
    });
    const instrumentation = orchestrator.instrumentation;
    const getEnveloped = (context = {}) => {
        const instrumented = (0, instrumentation_1.getInstrumented)({ context });
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
