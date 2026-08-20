import {getChildNodes as $cd5ea4b915021f1d$export$1005530eda016c13, getFirstItem as $cd5ea4b915021f1d$export$fbdeaa6a76694f71, getLastItem as $cd5ea4b915021f1d$export$7475b2c64539e4cf} from "../collections/getChildNodes.mjs";
import {useMultipleSelectionState as $60f19cefd567a3e4$export$253fe78d46329472} from "../selection/useMultipleSelectionState.mjs";
import {SelectionManager as $4a07ac835f260f78$export$6c8a5aaad13c9852} from "../selection/SelectionManager.mjs";
import {useMemo as $974D5$useMemo, useRef as $974D5$useRef, useEffect as $974D5$useEffect} from "react";





function $183b79a1dd6664c1$export$4007ac09ff9c68ed(props) {
    let { collection: collection, focusMode: focusMode } = props;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    let selectionState = props.UNSAFE_selectionState || (0, $60f19cefd567a3e4$export$253fe78d46329472)(props);
    let disabledKeys = (0, $974D5$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let setFocusedKey = selectionState.setFocusedKey;
    selectionState.setFocusedKey = (key, child)=>{
        // If focusMode is cell and an item is focused, focus a child cell instead.
        if (focusMode === 'cell' && key != null) {
            let item = collection.getItem(key);
            if (item?.type === 'item') {
                let children = (0, $cd5ea4b915021f1d$export$1005530eda016c13)(item, collection);
                if (child === 'last') key = (0, $cd5ea4b915021f1d$export$7475b2c64539e4cf)(children)?.key ?? null;
                else key = (0, $cd5ea4b915021f1d$export$fbdeaa6a76694f71)(children)?.key ?? null;
            }
        }
        setFocusedKey(key, child);
    };
    let selectionManager = (0, $974D5$useMemo)(()=>new (0, $4a07ac835f260f78$export$6c8a5aaad13c9852)(collection, selectionState), [
        collection,
        selectionState
    ]);
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $974D5$useRef)(null);
    (0, $974D5$useEffect)(()=>{
        if (selectionState.focusedKey != null && cachedCollection.current && !collection.getItem(selectionState.focusedKey)) {
            const node = cachedCollection.current.getItem(selectionState.focusedKey);
            const parentNode = node?.parentKey != null && (node.type === 'cell' || node.type === 'rowheader' || node.type === 'column') ? cachedCollection.current.getItem(node.parentKey) : node;
            if (!parentNode) {
                selectionState.setFocusedKey(null);
                return;
            }
            const cachedRows = cachedCollection.current.rows;
            const rows = collection.rows;
            const diff = cachedRows.length - rows.length;
            let index = Math.min(diff > 1 ? Math.max(parentNode.index - diff + 1, 0) : parentNode.index, rows.length - 1);
            let newRow = null;
            while(index >= 0){
                if (!selectionManager.isDisabled(rows[index].key) && rows[index].type !== 'headerrow') {
                    newRow = rows[index];
                    break;
                }
                // Find next, not disabled row.
                if (index < rows.length - 1) index++;
                else {
                    if (index > parentNode.index) index = parentNode.index;
                    index--;
                }
            }
            if (newRow) {
                const childNodes = newRow.hasChildNodes ? [
                    ...(0, $cd5ea4b915021f1d$export$1005530eda016c13)(newRow, collection)
                ] : [];
                const keyToFocus = newRow.hasChildNodes && parentNode !== node && node && node.index < childNodes.length ? childNodes[node.index].key : newRow.key;
                selectionState.setFocusedKey(keyToFocus);
            } else selectionState.setFocusedKey(null);
        }
        cachedCollection.current = collection;
    }, [
        collection,
        selectionManager,
        selectionState,
        selectionState.focusedKey
    ]);
    return {
        collection: collection,
        disabledKeys: disabledKeys,
        isKeyboardNavigationDisabled: false,
        selectionManager: selectionManager
    };
}


export {$183b79a1dd6664c1$export$4007ac09ff9c68ed as useGridState};
//# sourceMappingURL=useGridState.mjs.map
