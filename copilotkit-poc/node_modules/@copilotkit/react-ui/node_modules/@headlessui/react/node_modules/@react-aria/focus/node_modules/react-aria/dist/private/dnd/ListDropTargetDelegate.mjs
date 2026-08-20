class $993214027d63fe77$export$fbd65d14c79e28cc {
    constructor(collection, ref, options){
        this.collection = collection;
        this.ref = ref;
        this.layout = options?.layout || 'stack';
        this.orientation = options?.orientation || 'vertical';
        this.direction = options?.direction || 'ltr';
    }
    getPrimaryStart(rect) {
        return this.orientation === 'horizontal' ? rect.left : rect.top;
    }
    getPrimaryEnd(rect) {
        return this.orientation === 'horizontal' ? rect.right : rect.bottom;
    }
    getSecondaryStart(rect) {
        return this.orientation === 'horizontal' ? rect.top : rect.left;
    }
    getSecondaryEnd(rect) {
        return this.orientation === 'horizontal' ? rect.bottom : rect.right;
    }
    getFlowStart(rect) {
        return this.layout === 'stack' ? this.getPrimaryStart(rect) : this.getSecondaryStart(rect);
    }
    getFlowEnd(rect) {
        return this.layout === 'stack' ? this.getPrimaryEnd(rect) : this.getSecondaryEnd(rect);
    }
    getFlowSize(rect) {
        return this.getFlowEnd(rect) - this.getFlowStart(rect);
    }
    getDropTargetFromPoint(x, y, isValidDropTarget) {
        if (this.collection[Symbol.iterator]().next().done || !this.ref.current) return {
            type: 'root'
        };
        let rect = this.ref.current.getBoundingClientRect();
        let primary = this.orientation === 'horizontal' ? x : y;
        let secondary = this.orientation === 'horizontal' ? y : x;
        primary += this.getPrimaryStart(rect);
        secondary += this.getSecondaryStart(rect);
        let flow = this.layout === 'stack' ? primary : secondary;
        let isPrimaryRTL = this.orientation === 'horizontal' && this.direction === 'rtl';
        let isSecondaryRTL = this.layout === 'grid' && this.orientation === 'vertical' && this.direction === 'rtl';
        let isFlowRTL = this.layout === 'stack' ? isPrimaryRTL : isSecondaryRTL;
        let collection = this.ref.current?.dataset.collection;
        let elements = this.ref.current.querySelectorAll(collection ? `[data-collection="${CSS.escape(collection)}"]` : '[data-key]');
        let elementMap = new Map();
        for (let item of elements)if (item instanceof HTMLElement && item.dataset.key != null) elementMap.set(item.dataset.key, item);
        // TODO: assume that only item type items are valid drop targets. This is to prevent a crash when dragging over the loader
        // row since it doesn't have a data-key set on it. Will eventually need to handle the case with drag and drop and loaders located between rows aka tree.
        // Can see https://github.com/adobe/react-spectrum/pull/4210/files#diff-21e555e0c597a28215e36137f5be076a65a1e1456c92cd0fdd60f866929aae2a for additional logic
        // that may need to happen then
        let items = [
            ...this.collection
        ].filter((item)=>item.type === 'item');
        if (items.length < 1) return {
            type: 'root'
        };
        let low = 0;
        let high = items.length;
        while(low < high){
            let mid = Math.floor((low + high) / 2);
            let item = items[mid];
            let element = elementMap.get(String(item.key));
            if (!element) break;
            let rect = element.getBoundingClientRect();
            let update = (isGreater)=>{
                if (isGreater) low = mid + 1;
                else high = mid;
            };
            if (primary < this.getPrimaryStart(rect)) update(isPrimaryRTL);
            else if (primary > this.getPrimaryEnd(rect)) update(!isPrimaryRTL);
            else if (secondary < this.getSecondaryStart(rect)) update(isSecondaryRTL);
            else if (secondary > this.getSecondaryEnd(rect)) update(!isSecondaryRTL);
            else {
                let target = {
                    type: 'item',
                    key: item.key,
                    dropPosition: 'on'
                };
                if (isValidDropTarget(target)) {
                    // Otherwise, if dropping on the item is accepted, try the before/after positions if within 5px
                    // of the start or end of the item.
                    if (flow <= this.getFlowStart(rect) + 5 && isValidDropTarget({
                        ...target,
                        dropPosition: 'before'
                    })) target.dropPosition = isFlowRTL ? 'after' : 'before';
                    else if (flow >= this.getFlowEnd(rect) - 5 && isValidDropTarget({
                        ...target,
                        dropPosition: 'after'
                    })) target.dropPosition = isFlowRTL ? 'before' : 'after';
                } else {
                    // If dropping on the item isn't accepted, try the target before or after depending on the position.
                    let mid = this.getFlowStart(rect) + this.getFlowSize(rect) / 2;
                    if (flow <= mid && isValidDropTarget({
                        ...target,
                        dropPosition: 'before'
                    })) target.dropPosition = isFlowRTL ? 'after' : 'before';
                    else if (flow >= mid && isValidDropTarget({
                        ...target,
                        dropPosition: 'after'
                    })) target.dropPosition = isFlowRTL ? 'before' : 'after';
                }
                return target;
            }
        }
        let item = items[Math.min(low, items.length - 1)];
        let element = elementMap.get(String(item.key));
        rect = element?.getBoundingClientRect();
        if (rect && (primary < this.getPrimaryStart(rect) || Math.abs(flow - this.getFlowStart(rect)) < Math.abs(flow - this.getFlowEnd(rect)))) return {
            type: 'item',
            key: item.key,
            dropPosition: isFlowRTL ? 'after' : 'before'
        };
        return {
            type: 'item',
            key: item.key,
            dropPosition: isFlowRTL ? 'before' : 'after'
        };
    }
}


export {$993214027d63fe77$export$fbd65d14c79e28cc as ListDropTargetDelegate};
//# sourceMappingURL=ListDropTargetDelegate.mjs.map
