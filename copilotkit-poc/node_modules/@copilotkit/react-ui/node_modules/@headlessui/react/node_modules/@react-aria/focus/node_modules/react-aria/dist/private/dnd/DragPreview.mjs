import {flushSync as $10CnQ$flushSync} from "react-dom";
import $10CnQ$react, {useState as $10CnQ$useState, useRef as $10CnQ$useRef, useImperativeHandle as $10CnQ$useImperativeHandle, useEffect as $10CnQ$useEffect} from "react";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

const $5d3a17cc2564e64f$export$905ab40ac2179daa = /*#__PURE__*/ (0, $10CnQ$react).forwardRef(function DragPreview(props, ref) {
    let render = props.children;
    let [children, setChildren] = (0, $10CnQ$useState)(null);
    let domRef = (0, $10CnQ$useRef)(null);
    let raf = (0, $10CnQ$useRef)(undefined);
    (0, $10CnQ$useImperativeHandle)(ref, ()=>(items, callback)=>{
            // This will be called during the onDragStart event by useDrag. We need to render the
            // preview synchronously before this event returns so we can call event.dataTransfer.setDragImage.
            let result = render(items);
            let element;
            let offsetX;
            let offsetY;
            if (result && typeof result === 'object' && 'element' in result) {
                element = result.element;
                offsetX = result.x;
                offsetY = result.y;
            } else element = result;
            (0, $10CnQ$flushSync)(()=>{
                setChildren(element);
            });
            // Yield back to useDrag to set the drag image.
            callback(domRef.current, offsetX, offsetY);
            // Remove the preview from the DOM after a frame so the browser has time to paint.
            raf.current = requestAnimationFrame(()=>{
                setChildren(null);
            });
        }, [
        render
    ]);
    (0, $10CnQ$useEffect)(()=>{
        return ()=>{
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, []);
    if (!children) return null;
    return /*#__PURE__*/ (0, $10CnQ$react).createElement("div", {
        style: {
            zIndex: -100,
            position: 'fixed',
            top: 0,
            left: -100000
        },
        ref: domRef
    }, children);
});


export {$5d3a17cc2564e64f$export$905ab40ac2179daa as DragPreview};
//# sourceMappingURL=DragPreview.mjs.map
