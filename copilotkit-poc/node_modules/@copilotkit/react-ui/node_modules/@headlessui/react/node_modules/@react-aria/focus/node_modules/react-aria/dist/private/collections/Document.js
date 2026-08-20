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
 */ class $b4d65d3a608b09a7$export$410b0c854570d131 {
    *[Symbol.iterator]() {
        let node = this.firstChild;
        while(node){
            yield node;
            node = node.nextSibling;
        }
    }
    get firstChild() {
        return this._firstChild;
    }
    set firstChild(firstChild) {
        this._firstChild = firstChild;
        this.ownerDocument.markDirty(this);
    }
    get lastChild() {
        return this._lastChild;
    }
    set lastChild(lastChild) {
        this._lastChild = lastChild;
        this.ownerDocument.markDirty(this);
    }
    get previousSibling() {
        return this._previousSibling;
    }
    set previousSibling(previousSibling) {
        this._previousSibling = previousSibling;
        this.ownerDocument.markDirty(this);
    }
    get nextSibling() {
        return this._nextSibling;
    }
    set nextSibling(nextSibling) {
        this._nextSibling = nextSibling;
        this.ownerDocument.markDirty(this);
    }
    get parentNode() {
        return this._parentNode;
    }
    set parentNode(parentNode) {
        this._parentNode = parentNode;
        this.ownerDocument.markDirty(this);
    }
    get isConnected() {
        var _this_parentNode;
        return ((_this_parentNode = this.parentNode) === null || _this_parentNode === void 0 ? void 0 : _this_parentNode.isConnected) || false;
    }
    invalidateChildIndices(child) {
        if (this._minInvalidChildIndex == null || !this._minInvalidChildIndex.isConnected || child.index < this._minInvalidChildIndex.index) {
            this._minInvalidChildIndex = child;
            this.ownerDocument.markDirty(this);
        }
    }
    updateChildIndices() {
        let node = this._minInvalidChildIndex;
        while(node){
            node.index = node.previousSibling ? node.previousSibling.index + 1 : 0;
            node = node.nextSibling;
        }
        this._minInvalidChildIndex = null;
    }
    appendChild(child) {
        if (child.parentNode) child.parentNode.removeChild(child);
        if (this.firstChild == null) this.firstChild = child;
        if (this.lastChild) {
            this.lastChild.nextSibling = child;
            child.index = this.lastChild.index + 1;
            child.previousSibling = this.lastChild;
        } else {
            child.previousSibling = null;
            child.index = 0;
        }
        child.parentNode = this;
        child.nextSibling = null;
        this.lastChild = child;
        this.ownerDocument.markDirty(this);
        if (this.isConnected) this.ownerDocument.queueUpdate();
    }
    insertBefore(newNode, referenceNode) {
        if (referenceNode == null) return this.appendChild(newNode);
        if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
        newNode.nextSibling = referenceNode;
        newNode.previousSibling = referenceNode.previousSibling;
        // Ensure that the newNode's index is less than that of the reference node so that
        // invalidateChildIndices will properly use the newNode as the _minInvalidChildIndex, thus making sure
        // we will properly update the indexes of all sibiling nodes after the newNode. The value here doesn't matter
        // since updateChildIndices should calculate the proper indexes.
        newNode.index = referenceNode.index - 1;
        if (this.firstChild === referenceNode) this.firstChild = newNode;
        else if (referenceNode.previousSibling) referenceNode.previousSibling.nextSibling = newNode;
        referenceNode.previousSibling = newNode;
        newNode.parentNode = referenceNode.parentNode;
        this.invalidateChildIndices(newNode);
        if (this.isConnected) this.ownerDocument.queueUpdate();
    }
    removeChild(child) {
        if (child.parentNode !== this) return;
        if (this._minInvalidChildIndex === child) this._minInvalidChildIndex = null;
        if (child.nextSibling) {
            this.invalidateChildIndices(child.nextSibling);
            child.nextSibling.previousSibling = child.previousSibling;
        }
        if (child.previousSibling) child.previousSibling.nextSibling = child.nextSibling;
        if (this.firstChild === child) this.firstChild = child.nextSibling;
        if (this.lastChild === child) this.lastChild = child.previousSibling;
        child.parentNode = null;
        child.nextSibling = null;
        child.previousSibling = null;
        child.index = 0;
        this.ownerDocument.markDirty(child);
        if (this.isConnected) this.ownerDocument.queueUpdate();
    }
    addEventListener() {}
    removeEventListener() {}
    get previousVisibleSibling() {
        let node = this.previousSibling;
        while(node && node.isHidden)node = node.previousSibling;
        return node;
    }
    get nextVisibleSibling() {
        let node = this.nextSibling;
        while(node && node.isHidden)node = node.nextSibling;
        return node;
    }
    get firstVisibleChild() {
        let node = this.firstChild;
        while(node && node.isHidden)node = node.nextSibling;
        return node;
    }
    get lastVisibleChild() {
        let node = this.lastChild;
        while(node && node.isHidden)node = node.previousSibling;
        return node;
    }
    constructor(ownerDocument){
        this._firstChild = null;
        this._lastChild = null;
        this._previousSibling = null;
        this._nextSibling = null;
        this._parentNode = null;
        this._minInvalidChildIndex = null;
        this.ownerDocument = ownerDocument;
    }
}
class $b4d65d3a608b09a7$export$dc064fe9e59310fd extends $b4d65d3a608b09a7$export$410b0c854570d131 {
    get index() {
        return this._index;
    }
    set index(index) {
        this._index = index;
        this.ownerDocument.markDirty(this);
    }
    get level() {
        var _this_parentNode_node;
        if (this.parentNode instanceof $b4d65d3a608b09a7$export$dc064fe9e59310fd) return this.parentNode.level + (((_this_parentNode_node = this.parentNode.node) === null || _this_parentNode_node === void 0 ? void 0 : _this_parentNode_node.type) === 'item' ? 1 : 0);
        return 0;
    }
    /**
   * Lazily gets a mutable instance of a Node. If the node has already
   * been cloned during this update cycle, it just returns the existing one.
   */ getMutableNode() {
        if (this.node == null) return null;
        if (!this.isMutated) {
            this.node = this.node.clone();
            this.isMutated = true;
        }
        this.ownerDocument.markDirty(this);
        return this.node;
    }
    updateNode() {
        var _this_parentNode_node, _this_previousVisibleSibling_node, _this_previousVisibleSibling, _nextSibling_node, _this_firstVisibleChild_node, _this_firstVisibleChild, _this_lastVisibleChild_node, _this_lastVisibleChild;
        let nextSibling = this.nextVisibleSibling;
        let node = this.getMutableNode();
        if (node == null) return;
        node.index = this.index;
        node.level = this.level;
        var _this_parentNode_node_key;
        node.parentKey = this.parentNode instanceof $b4d65d3a608b09a7$export$dc064fe9e59310fd ? (_this_parentNode_node_key = (_this_parentNode_node = this.parentNode.node) === null || _this_parentNode_node === void 0 ? void 0 : _this_parentNode_node.key) !== null && _this_parentNode_node_key !== void 0 ? _this_parentNode_node_key : null : null;
        var _this_previousVisibleSibling_node_key;
        node.prevKey = (_this_previousVisibleSibling_node_key = (_this_previousVisibleSibling = this.previousVisibleSibling) === null || _this_previousVisibleSibling === void 0 ? void 0 : (_this_previousVisibleSibling_node = _this_previousVisibleSibling.node) === null || _this_previousVisibleSibling_node === void 0 ? void 0 : _this_previousVisibleSibling_node.key) !== null && _this_previousVisibleSibling_node_key !== void 0 ? _this_previousVisibleSibling_node_key : null;
        var _nextSibling_node_key;
        node.nextKey = (_nextSibling_node_key = nextSibling === null || nextSibling === void 0 ? void 0 : (_nextSibling_node = nextSibling.node) === null || _nextSibling_node === void 0 ? void 0 : _nextSibling_node.key) !== null && _nextSibling_node_key !== void 0 ? _nextSibling_node_key : null;
        node.hasChildNodes = !!this.firstChild;
        var _this_firstVisibleChild_node_key;
        node.firstChildKey = (_this_firstVisibleChild_node_key = (_this_firstVisibleChild = this.firstVisibleChild) === null || _this_firstVisibleChild === void 0 ? void 0 : (_this_firstVisibleChild_node = _this_firstVisibleChild.node) === null || _this_firstVisibleChild_node === void 0 ? void 0 : _this_firstVisibleChild_node.key) !== null && _this_firstVisibleChild_node_key !== void 0 ? _this_firstVisibleChild_node_key : null;
        var _this_lastVisibleChild_node_key;
        node.lastChildKey = (_this_lastVisibleChild_node_key = (_this_lastVisibleChild = this.lastVisibleChild) === null || _this_lastVisibleChild === void 0 ? void 0 : (_this_lastVisibleChild_node = _this_lastVisibleChild.node) === null || _this_lastVisibleChild_node === void 0 ? void 0 : _this_lastVisibleChild_node.key) !== null && _this_lastVisibleChild_node_key !== void 0 ? _this_lastVisibleChild_node_key : null;
        // Update the colIndex of sibling nodes if this node has a colSpan.
        if ((node.colSpan != null || node.colIndex != null) && nextSibling) {
            var _node_colIndex, _node_colSpan;
            // This queues the next sibling for update, which means this happens recursively.
            let nextColIndex = ((_node_colIndex = node.colIndex) !== null && _node_colIndex !== void 0 ? _node_colIndex : node.index) + ((_node_colSpan = node.colSpan) !== null && _node_colSpan !== void 0 ? _node_colSpan : 1);
            if (nextSibling.node != null && nextColIndex !== nextSibling.node.colIndex) {
                let siblingNode = nextSibling.getMutableNode();
                siblingNode.colIndex = nextColIndex;
            }
        }
    }
    setProps(obj, ref, CollectionNodeClass, rendered, render) {
        let node;
        let { value: value1, textValue: textValue, id: id, ...props } = obj;
        if (this.node == null) {
            node = new CollectionNodeClass(id !== null && id !== void 0 ? id : `react-aria-${++this.ownerDocument.nodeId}`);
            this.node = node;
        } else node = this.getMutableNode();
        props.ref = ref;
        node.props = props;
        node.rendered = rendered;
        node.render = render;
        node.value = value1;
        if (obj['aria-label']) node['aria-label'] = obj['aria-label'];
        node.textValue = textValue || (typeof props.children === 'string' ? props.children : '') || obj['aria-label'] || '';
        if (id != null && id !== node.key) throw new Error('Cannot change the id of an item');
        if (props.colSpan != null) node.colSpan = props.colSpan;
        if (this.isConnected) this.ownerDocument.queueUpdate();
    }
    get style() {
        // React sets display: none to hide elements during Suspense.
        // We'll handle this by setting the element to hidden and invalidating
        // its siblings/parent. Hidden elements remain in the Document, but
        // are removed from the Collection.
        let element = this;
        return {
            get display () {
                return element.isHidden ? 'none' : '';
            },
            set display (value){
                let isHidden = value === 'none';
                if (element.isHidden !== isHidden) {
                    var _element_parentNode, _element_parentNode1;
                    // Mark parent node dirty if this element is currently the first or last visible child.
                    if (((_element_parentNode = element.parentNode) === null || _element_parentNode === void 0 ? void 0 : _element_parentNode.firstVisibleChild) === element || ((_element_parentNode1 = element.parentNode) === null || _element_parentNode1 === void 0 ? void 0 : _element_parentNode1.lastVisibleChild) === element) element.ownerDocument.markDirty(element.parentNode);
                    // Mark sibling visible elements dirty.
                    let prev = element.previousVisibleSibling;
                    let next = element.nextVisibleSibling;
                    if (prev) element.ownerDocument.markDirty(prev);
                    if (next) element.ownerDocument.markDirty(next);
                    // Mark self dirty.
                    element.isHidden = isHidden;
                    element.ownerDocument.markDirty(element);
                }
            }
        };
    }
    hasAttribute() {}
    setAttribute() {}
    setAttributeNS() {}
    removeAttribute() {}
    constructor(type, ownerDocument){
        super(ownerDocument), this.nodeType = 8 // COMMENT_NODE (we'd use ELEMENT_NODE but React DevTools will fail to get its dimensions)
        , this.isMutated = true, this._index = 0, this.isHidden = false;
        this.node = null;
    }
}
class $b4d65d3a608b09a7$export$b34a105447964f9f extends $b4d65d3a608b09a7$export$410b0c854570d131 {
    get isConnected() {
        return true;
    }
    createElement(type) {
        return new $b4d65d3a608b09a7$export$dc064fe9e59310fd(type, this);
    }
    getMutableCollection() {
        if (!this.nextCollection) this.nextCollection = this.collection.clone();
        return this.nextCollection;
    }
    markDirty(node) {
        this.dirtyNodes.add(node);
    }
    addNode(element) {
        if (element.isHidden || element.node == null) return;
        let collection = this.getMutableCollection();
        if (!collection.getItem(element.node.key)) for (let child of element)this.addNode(child);
        collection.addNode(element.node);
    }
    removeNode(node) {
        for (let child of node)this.removeNode(child);
        if (node.node) {
            let collection = this.getMutableCollection();
            collection.removeNode(node.node.key);
        }
    }
    /** Finalizes the collection update, updating all nodes and freezing the collection. */ getCollection() {
        // If in a subscription update, return return the existing collection.
        // React will call getCollection again during render, at which point all the updates will be complete.
        if (this.inSubscription) return this.collection;
        // Reset queuedRender to false when getCollection is called during render.
        this.queuedRender = false;
        this.updateCollection();
        return this.collection;
    }
    updateCollection() {
        // First, remove disconnected nodes and update the indices of dirty element children.
        for (let element of this.dirtyNodes)if (element instanceof $b4d65d3a608b09a7$export$dc064fe9e59310fd && (!element.isConnected || element.isHidden)) this.removeNode(element);
        else element.updateChildIndices();
        // Next, update dirty collection nodes.
        for (let element of this.dirtyNodes)if (element instanceof $b4d65d3a608b09a7$export$dc064fe9e59310fd) {
            if (element.isConnected && !element.isHidden) {
                element.updateNode();
                this.addNode(element);
            }
            if (element.node) this.dirtyNodes.delete(element);
            element.isMutated = false;
        } else this.dirtyNodes.delete(element);
        // Finally, update the collection.
        if (this.nextCollection) {
            var _this_firstVisibleChild_node, _this_firstVisibleChild, _this_lastVisibleChild_node, _this_lastVisibleChild;
            var _this_firstVisibleChild_node_key, _this_lastVisibleChild_node_key;
            this.nextCollection.commit((_this_firstVisibleChild_node_key = (_this_firstVisibleChild = this.firstVisibleChild) === null || _this_firstVisibleChild === void 0 ? void 0 : (_this_firstVisibleChild_node = _this_firstVisibleChild.node) === null || _this_firstVisibleChild_node === void 0 ? void 0 : _this_firstVisibleChild_node.key) !== null && _this_firstVisibleChild_node_key !== void 0 ? _this_firstVisibleChild_node_key : null, (_this_lastVisibleChild_node_key = (_this_lastVisibleChild = this.lastVisibleChild) === null || _this_lastVisibleChild === void 0 ? void 0 : (_this_lastVisibleChild_node = _this_lastVisibleChild.node) === null || _this_lastVisibleChild_node === void 0 ? void 0 : _this_lastVisibleChild_node.key) !== null && _this_lastVisibleChild_node_key !== void 0 ? _this_lastVisibleChild_node_key : null, this.isSSR);
            if (!this.isSSR) {
                this.collection = this.nextCollection;
                this.nextCollection = null;
            }
        }
    }
    queueUpdate() {
        if (this.dirtyNodes.size === 0 || this.queuedRender) return;
        // Only trigger subscriptions once during an update, when the first item changes.
        // React's useSyncExternalStore will call getCollection immediately, to check whether the snapshot changed.
        // If so, React will queue a render to happen after the current commit to our fake DOM finishes.
        // We track whether getCollection is called in a subscription, and once it is called during render,
        // we reset queuedRender back to false.
        this.queuedRender = true;
        this.inSubscription = true;
        // Clone the collection to ensure that React queues a render. It will call getCollection again
        // during render, at which point all the updates will be complete and we can return
        // the new collection.
        if (!this.isSSR) this.collection = this.collection.clone();
        for (let fn of this.subscriptions)fn();
        this.inSubscription = false;
    }
    subscribe(fn) {
        this.subscriptions.add(fn);
        return ()=>this.subscriptions.delete(fn);
    }
    resetAfterSSR() {
        if (this.isSSR) {
            this.isSSR = false;
            this.firstChild = null;
            this.lastChild = null;
            this.nodeId = 0;
        }
    }
    constructor(collection){
        // @ts-ignore
        super(null), this.nodeType = 11 // DOCUMENT_FRAGMENT_NODE
        , this.ownerDocument = this, this.dirtyNodes = new Set(), this.isSSR = false, this.nodeId = 0, this.nodesByProps = new WeakMap(), this.nextCollection = null, this.subscriptions = new Set(), this.queuedRender = false, this.inSubscription = false;
        this.collection = collection;
        this.nextCollection = collection;
    }
}


export {$b4d65d3a608b09a7$export$410b0c854570d131 as BaseNode, $b4d65d3a608b09a7$export$dc064fe9e59310fd as ElementNode, $b4d65d3a608b09a7$export$b34a105447964f9f as Document};
//# sourceMappingURL=Document.js.map
