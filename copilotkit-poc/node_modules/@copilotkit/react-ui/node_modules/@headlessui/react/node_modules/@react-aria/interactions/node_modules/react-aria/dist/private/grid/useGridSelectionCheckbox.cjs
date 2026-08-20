var $88d878ce22ac7f67$exports = require("./intlStrings.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridSelectionCheckbox", function () { return $6f0f3cb792714c98$export$70e2eed1a92976ad; });



function $6f0f3cb792714c98$export$70e2eed1a92976ad(props, state) {
    let { key: key } = props;
    let manager = state.selectionManager;
    let checkboxId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let isDisabled = !state.selectionManager.canSelectItem(key);
    let isSelected = state.selectionManager.isSelected(key);
    // Checkbox should always toggle selection, regardless of selectionBehavior.
    let onChange = ()=>manager.toggleSelection(key);
    const stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($88d878ce22ac7f67$exports))), '@react-aria/grid');
    return {
        checkboxProps: {
            id: checkboxId,
            'aria-label': stringFormatter.format('select'),
            isSelected: isSelected,
            isDisabled: isDisabled,
            onChange: onChange
        }
    };
}


//# sourceMappingURL=useGridSelectionCheckbox.cjs.map
