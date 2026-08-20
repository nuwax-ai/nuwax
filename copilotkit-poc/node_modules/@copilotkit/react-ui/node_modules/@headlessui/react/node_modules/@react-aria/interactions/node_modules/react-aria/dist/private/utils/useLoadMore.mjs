import {useEvent as $600b3cf69ae46262$export$90fc3a17d93f704c} from "./useEvent.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "./useLayoutEffect.mjs";
import {useRef as $dTWCl$useRef, useCallback as $dTWCl$useCallback} from "react";

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


function $e21c75ef2d96a1a6$export$7717c92ee915373e(props, ref) {
    let { isLoading: isLoading, onLoadMore: onLoadMore, scrollOffset: scrollOffset = 1, items: items } = props;
    // Handle scrolling, and call onLoadMore when nearing the bottom.
    let isLoadingRef = (0, $dTWCl$useRef)(isLoading);
    let prevProps = (0, $dTWCl$useRef)(props);
    let onScroll = (0, $dTWCl$useCallback)(()=>{
        if (ref.current && !isLoadingRef.current && onLoadMore) {
            let shouldLoadMore = ref.current.scrollHeight - ref.current.scrollTop - ref.current.clientHeight < ref.current.clientHeight * scrollOffset;
            if (shouldLoadMore) {
                isLoadingRef.current = true;
                onLoadMore();
            }
        }
    }, [
        onLoadMore,
        ref,
        scrollOffset
    ]);
    let lastItems = (0, $dTWCl$useRef)(items);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        // Only update isLoadingRef if props object actually changed,
        // not if a local state change occurred.
        if (props !== prevProps.current) {
            isLoadingRef.current = isLoading;
            prevProps.current = props;
        }
        // TODO: Eventually this hook will move back into RAC during which we will accept the collection as a option to this hook.
        // We will only load more if the collection has changed after the last load to prevent multiple onLoadMore from being called
        // while the data from the last onLoadMore is being processed by RAC collection.
        let shouldLoadMore = ref?.current && !isLoadingRef.current && onLoadMore && (!items || items !== lastItems.current) && ref.current.clientHeight === ref.current.scrollHeight;
        if (shouldLoadMore) {
            isLoadingRef.current = true;
            onLoadMore?.();
        }
        lastItems.current = items;
    }, [
        isLoading,
        onLoadMore,
        props,
        ref,
        items
    ]);
    // TODO: maybe this should still just return scroll props?
    // Test against case where the ref isn't defined when this is called
    // Think this was a problem when trying to attach to the scrollable body of the table in OnLoadMoreTableBodyScroll
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(ref, 'scroll', onScroll);
}


export {$e21c75ef2d96a1a6$export$7717c92ee915373e as useLoadMore};
//# sourceMappingURL=useLoadMore.mjs.map
