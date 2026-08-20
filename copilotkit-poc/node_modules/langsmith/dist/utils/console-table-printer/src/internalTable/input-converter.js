import { DEFAULT_ROW_ALIGNMENT } from '../utils/table-constants.js';
export const objIfExists = (key, val) => {
    if (!val) {
        return {};
    }
    return {
        [key]: val,
    };
};
export const rawColumnToInternalColumn = (column, defaultColumnStyles) => ({
    name: column.name,
    title: column.title ?? column.name,
    ...objIfExists('color', (column.color || defaultColumnStyles?.color)),
    ...objIfExists('maxLen', (column.maxLen || defaultColumnStyles?.maxLen)),
    ...objIfExists('minLen', (column.minLen || defaultColumnStyles?.minLen)),
    alignment: (column.alignment ||
        defaultColumnStyles?.alignment ||
        DEFAULT_ROW_ALIGNMENT),
    transform: column.transform,
});
