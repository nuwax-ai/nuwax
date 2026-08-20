export function isPromiseLike(value) {
    return value != null && typeof value.then === "function";
}
