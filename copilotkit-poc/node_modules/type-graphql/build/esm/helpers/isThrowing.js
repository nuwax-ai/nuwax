export function isThrowing(fn) {
    try {
        fn();
        return false;
    }
    catch {
        return true;
    }
}
