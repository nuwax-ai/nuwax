"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSettings = void 0;
const analytics_core_1 = require("@segment/analytics-core");
const validateSettings = (settings) => {
    if (!settings.writeKey) {
        throw new analytics_core_1.ValidationError('writeKey', 'writeKey is missing.');
    }
};
exports.validateSettings = validateSettings;
//# sourceMappingURL=settings.js.map