import $cPCZU$intlStringsjs from "./intlStrings.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}



function $ba59c92b3d4c78e7$export$70e2eed1a92976ad(props, state) {
    let { key: key } = props;
    let manager = state.selectionManager;
    let checkboxId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let isDisabled = !state.selectionManager.canSelectItem(key);
    let isSelected = state.selectionManager.isSelected(key);
    // Checkbox should always toggle selection, regardless of selectionBehavior.
    let onChange = ()=>manager.toggleSelection(key);
    const stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($cPCZU$intlStringsjs))), '@react-aria/grid');
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


export {$ba59c92b3d4c78e7$export$70e2eed1a92976ad as useGridSelectionCheckbox};
//# sourceMappingURL=useGridSelectionCheckbox.js.map
