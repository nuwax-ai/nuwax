import { __extends } from "tslib";
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(field, message) {
        var _this = _super.call(this, "".concat(field, " ").concat(message)) || this;
        _this.field = field;
        return _this;
    }
    return ValidationError;
}(Error));
export { ValidationError };
//# sourceMappingURL=errors.js.map