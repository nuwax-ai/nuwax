"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
var tslib_1 = require("tslib");
var ValidationError = /** @class */ (function (_super) {
    tslib_1.__extends(ValidationError, _super);
    function ValidationError(field, message) {
        var _this = _super.call(this, "".concat(field, " ").concat(message)) || this;
        _this.field = field;
        return _this;
    }
    return ValidationError;
}(Error));
exports.ValidationError = ValidationError;
//# sourceMappingURL=errors.js.map