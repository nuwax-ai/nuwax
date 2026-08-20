export class WrongNullableListOptionError extends Error {
    constructor(targetName, propertyName, nullable) {
        super(`Wrong nullable option set for ${targetName}#${propertyName}. ` +
            `You cannot combine non-list type with nullable '${nullable}'.`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
