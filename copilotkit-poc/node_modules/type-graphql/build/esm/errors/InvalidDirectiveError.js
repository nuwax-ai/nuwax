export class InvalidDirectiveError extends Error {
    constructor(msg) {
        super(msg);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
