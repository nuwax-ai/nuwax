import { ValidationError } from '@segment/analytics-core';
export const validateSettings = (settings) => {
    if (!settings.writeKey) {
        throw new ValidationError('writeKey', 'writeKey is missing.');
    }
};
//# sourceMappingURL=settings.js.map