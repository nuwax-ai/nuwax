import $iU8zV$intlStringsmjs from "./intlStrings.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}



function $575d7acf5e0b35f6$export$70e2eed1a92976ad(props, state) {
    let { key: key } = props;
    let manager = state.selectionManager;
    let checkboxId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let isDisabled = !state.selectionManager.canSelectItem(key);
    let isSelected = state.selectionManager.isSelected(key);
    // Checkbox should always toggle selection, regardless of selectionBehavior.
    let onChange = ()=>manager.toggleSelection(key);
    const stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($iU8zV$intlStringsmjs))), '@react-aria/grid');
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


export {$575d7acf5e0b35f6$export$70e2eed1a92976ad as useGridSelectionCheckbox};
//# sourceMappingURL=useGridSelectionCheckbox.mjs.map
