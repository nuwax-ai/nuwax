"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfiguredNodePlugin = exports.createNodePlugin = void 0;
const publisher_1 = require("./publisher");
const version_1 = require("../../generated/version");
const env_1 = require("../../lib/env");
function normalizeEvent(ctx) {
    ctx.updateEvent('context.library.name', '@segment/analytics-node');
    ctx.updateEvent('context.library.version', version_1.version);
    const runtime = (0, env_1.detectRuntime)();
    if (runtime === 'node') {
        // eslint-disable-next-line no-restricted-globals
        ctx.updateEvent('_metadata.nodeVersion', process.version);
    }
    ctx.updateEvent('_metadata.jsRuntime', runtime);
}
function createNodePlugin(publisher) {
    function action(ctx) {
        normalizeEvent(ctx);
        return publisher.enqueue(ctx);
    }
    return {
        name: 'Segment.io',
        type: 'destination',
        version: '1.0.0',
        isLoaded: () => true,
        load: () => Promise.resolve(),
        alias: action,
        group: action,
        identify: action,
        page: action,
        screen: action,
        track: action,
    };
}
exports.createNodePlugin = createNodePlugin;
const createConfiguredNodePlugin = (props, emitter) => {
    const publisher = new publisher_1.Publisher(props, emitter);
    return {
        publisher: publisher,
        plugin: createNodePlugin(publisher),
    };
};
exports.createConfiguredNodePlugin = createConfiguredNodePlugin;
//# sourceMappingURL=index.js.map