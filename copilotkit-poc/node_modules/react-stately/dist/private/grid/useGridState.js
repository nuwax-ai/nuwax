import {getChildNodes as $684db7aaf37fc901$export$1005530eda016c13, getFirstItem as $684db7aaf37fc901$export$fbdeaa6a76694f71, getLastItem as $684db7aaf37fc901$export$7475b2c64539e4cf} from "../collections/getChildNodes.js";
import {useMultipleSelectionState as $8696e7d7c3c9007a$export$253fe78d46329472} from "../selection/useMultipleSelectionState.js";
import {SelectionManager as $60fcbaf037242b1f$export$6c8a5aaad13c9852} from "../selection/SelectionManager.js";
import {useMemo as $48ZBF$useMemo, useRef as $48ZBF$useRef, useEffect as $48ZBF$useEffect} from "react";





function $5f05a272399e60e1$export$4007ac09ff9c68ed(props) {
    let { collection: collection, focusMode: focusMode } = props;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    let selectionState = props.UNSAFE_selectionState || (0, $8696e7d7c3c9007a$export$253fe78d46329472)(props);
    let disabledKeys = (0, $48ZBF$useMemo)(()=>props.disabledKeys ? new Set(props.disabledKeys) : new Set(), [
        props.disabledKeys
    ]);
    let setFocusedKey = selectionState.setFocusedKey;
    selectionState.setFocusedKey = (key, child)=>{
        // If focusMode is cell and an item is focused, focus a child cell instead.
        if (focusMode === 'cell' && key != null) {
            let item = collection.getItem(key);
            if ((item === null || item === void 0 ? void 0 : item.type) === 'item') {
                var _getLastItem, _getFirstItem;
                let children = (0, $684db7aaf37fc901$export$1005530eda016c13)(item, collection);
                var _getLastItem_key, _getFirstItem_key;
                if (child === 'last') key = (_getLastItem_key = (_getLastItem = (0, $684db7aaf37fc901$export$7475b2c64539e4cf)(children)) === null || _getLastItem === void 0 ? void 0 : _getLastItem.key) !== null && _getLastItem_key !== void 0 ? _getLastItem_key : null;
                else key = (_getFirstItem_key = (_getFirstItem = (0, $684db7aaf37fc901$export$fbdeaa6a76694f71)(children)) === null || _getFirstItem === void 0 ? void 0 : _getFirstItem.key) !== null && _getFirstItem_key !== void 0 ? _getFirstItem_key : null;
            }
        }
        setFocusedKey(key, child);
    };
    let selectionManager = (0, $48ZBF$useMemo)(()=>new (0, $60fcbaf037242b1f$export$6c8a5aaad13c9852)(collection, selectionState), [
        collection,
        selectionState
    ]);
    // Reset focused key if that item is deleted from the collection.
    const cachedCollection = (0, $48ZBF$useRef)(null);
    (0, $48ZBF$useEffect)(()=>{
        if (selectionState.focusedKey != null && cachedCollection.current && !collection.getItem(selectionState.focusedKey)) {
            const node = cachedCollection.current.getItem(selectionState.focusedKey);
            const parentNode = (node === null || node === void 0 ? void 0 : node.parentKey) != null && (node.type === 'cell' || node.type === 'rowheader' || node.type === 'column') ? cachedCollection.current.getItem(node.parentKey) : node;
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
                    ...(0, $684db7aaf37fc901$export$1005530eda016c13)(newRow, collection)
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


export {$5f05a272399e60e1$export$4007ac09ff9c68ed as useGridState};
//# sourceMappingURL=useGridState.js.map
