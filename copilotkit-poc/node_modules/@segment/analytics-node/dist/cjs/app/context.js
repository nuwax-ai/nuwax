"use strict";
// create a derived class since we may want to add node specific things to Context later
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const analytics_core_1 = require("@segment/analytics-core");
// While this is not a type, it is a definition
class Context extends analytics_core_1.CoreContext {
    static system() {
        return new this({ type: 'track', event: 'system' });
    }
}
exports.Context = Context;
//# sourceMappingURL=context.js.map