"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeferred = void 0;
/**
 * Return a promise that can be externally resolved
 */
var createDeferred = function () {
    var resolve;
    var reject;
    var settled = false;
    var promise = new Promise(function (_resolve, _reject) {
        resolve = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            settled = true;
            _resolve.apply(void 0, args);
        };
        reject = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            settled = true;
            _reject.apply(void 0, args);
        };
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise,
        isSettled: function () { return settled; },
    };
};
exports.createDeferred = createDeferred;
//# sourceMappingURL=create-deferred.js.map