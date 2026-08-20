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
 */ class $0c55dae31ace3277$export$d68d59712b04d9d1 {
    get childNodes() {
        throw new Error('childNodes is not supported');
    }
    clone() {
        let node = new this.constructor(this.key);
        node.value = this.value;
        node.level = this.level;
        node.hasChildNodes = this.hasChildNodes;
        node.rendered = this.rendered;
        node.textValue = this.textValue;
        node['aria-label'] = this['aria-label'];
        node.index = this.index;
        node.parentKey = this.parentKey;
        node.prevKey = this.prevKey;
        node.nextKey = this.nextKey;
        node.firstChildKey = this.firstChildKey;
        node.lastChildKey = this.lastChildKey;
        node.props = this.props;
        node.render = this.render;
        node.colSpan = this.colSpan;
        node.colIndex = this.colIndex;
        return node;
    }
    filter(collection, newCollection, // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filterFn) {
        let clone = this.clone();
        newCollection.addDescendants(clone, collection);
        return clone;
    }
    constructor(key){
        this.value = null;
        this.level = 0;
        this.hasChildNodes = false;
        this.rendered = null;
        this.textValue = '';
        this['aria-label'] = undefined;
        this.index = 0;
        this.parentKey = null;
        this.prevKey = null;
        this.nextKey = null;
        this.firstChildKey = null;
        this.lastChildKey = null;
        this.props = {};
        this.colSpan = null;
        this.colIndex = null;
        this.type = this.constructor.type;
        this.key = key;
    }
}
class $0c55dae31ace3277$export$b1918e978f1ee46f extends $0c55dae31ace3277$export$d68d59712b04d9d1 {
    filter(collection, newCollection, filterFn) {
        let [firstKey, lastKey] = $0c55dae31ace3277$var$filterChildren(collection, newCollection, this.firstChildKey, filterFn);
        let newNode = this.clone();
        newNode.firstChildKey = firstKey;
        newNode.lastChildKey = lastKey;
        return newNode;
    }
}
class $0c55dae31ace3277$export$5ae2504e948afce5 extends $0c55dae31ace3277$export$d68d59712b04d9d1 {
}
$0c55dae31ace3277$export$5ae2504e948afce5.type = 'header';
class $0c55dae31ace3277$export$8258a0665a675899 extends $0c55dae31ace3277$export$d68d59712b04d9d1 {
}
$0c55dae31ace3277$export$8258a0665a675899.type = 'loader';
class $0c55dae31ace3277$export$fd11f34e1d07f134 extends $0c55dae31ace3277$export$b1918e978f1ee46f {
    filter(collection, newCollection, filterFn) {
        if (filterFn(this.textValue, this)) {
            let clone = this.clone();
            newCollection.addDescendants(clone, collection);
            return clone;
        }
        return null;
    }
}
$0c55dae31ace3277$export$fd11f34e1d07f134.type = 'item';
class $0c55dae31ace3277$export$437f11dc9b403b78 extends $0c55dae31ace3277$export$b1918e978f1ee46f {
    filter(collection, newCollection, filterFn) {
        let filteredSection = super.filter(collection, newCollection, filterFn);
        if (filteredSection) {
            if (filteredSection.lastChildKey !== null) {
                let lastChild = collection.getItem(filteredSection.lastChildKey);
                if (lastChild && lastChild.type !== 'header') return filteredSection;
            }
        }
        return null;
    }
}
$0c55dae31ace3277$export$437f11dc9b403b78.type = 'section';
class $0c55dae31ace3277$export$408d25a4e12db025 {
    get size() {
        return this.itemCount;
    }
    getKeys() {
        return this.keyMap.keys();
    }
    *[Symbol.iterator]() {
        let node = this.firstKey != null ? this.keyMap.get(this.firstKey) : undefined;
        while(node){
            yield node;
            node = node.nextKey != null ? this.keyMap.get(node.nextKey) : undefined;
        }
    }
    getChildren(key) {
        let keyMap = this.keyMap;
        return {
            *[Symbol.iterator] () {
                let parent = keyMap.get(key);
                let node = (parent === null || parent === void 0 ? void 0 : parent.firstChildKey) != null ? keyMap.get(parent.firstChildKey) : null;
                while(node){
                    yield node;
                    node = node.nextKey != null ? keyMap.get(node.nextKey) : undefined;
                }
            }
        };
    }
    getKeyBefore(key) {
        let node = this.keyMap.get(key);
        if (!node) return null;
        if (node.prevKey != null) {
            node = this.keyMap.get(node.prevKey);
            while(node && node.type !== 'item' && node.lastChildKey != null)node = this.keyMap.get(node.lastChildKey);
            var _node_key;
            return (_node_key = node === null || node === void 0 ? void 0 : node.key) !== null && _node_key !== void 0 ? _node_key : null;
        }
        return node.parentKey;
    }
    getKeyAfter(key) {
        let node = this.keyMap.get(key);
        if (!node) return null;
        if (node.type !== 'item' && node.firstChildKey != null) return node.firstChildKey;
        while(node){
            if (node.nextKey != null) return node.nextKey;
            if (node.parentKey != null) node = this.keyMap.get(node.parentKey);
            else return null;
        }
        return null;
    }
    getFirstKey() {
        return this.firstKey;
    }
    getLastKey() {
        let node = this.lastKey != null ? this.keyMap.get(this.lastKey) : null;
        while((node === null || node === void 0 ? void 0 : node.lastChildKey) != null)node = this.keyMap.get(node.lastChildKey);
        var _node_key;
        return (_node_key = node === null || node === void 0 ? void 0 : node.key) !== null && _node_key !== void 0 ? _node_key : null;
    }
    getItem(key) {
        var _this_keyMap_get;
        return (_this_keyMap_get = this.keyMap.get(key)) !== null && _this_keyMap_get !== void 0 ? _this_keyMap_get : null;
    }
    at() {
        throw new Error('Not implemented');
    }
    clone() {
        // We need to clone using this.constructor so that subclasses have the right prototype.
        // TypeScript isn't happy about this yet.
        // https://github.com/microsoft/TypeScript/issues/3841
        let Constructor = this.constructor;
        let collection = new Constructor();
        collection.keyMap = new Map(this.keyMap);
        collection.firstKey = this.firstKey;
        collection.lastKey = this.lastKey;
        collection.itemCount = this.itemCount;
        return collection;
    }
    addNode(node) {
        if (this.frozen) throw new Error('Cannot add a node to a frozen collection');
        if (node.type === 'item' && this.keyMap.get(node.key) == null) this.itemCount++;
        this.keyMap.set(node.key, node);
    }
    // Deeply add a node and its children to the collection from another collection, primarily used when filtering a collection
    addDescendants(node, oldCollection) {
        this.addNode(node);
        let children = oldCollection.getChildren(node.key);
        for (let child of children)this.addDescendants(child, oldCollection);
    }
    removeNode(key) {
        if (this.frozen) throw new Error('Cannot remove a node to a frozen collection');
        let node = this.keyMap.get(key);
        if (node != null && node.type === 'item') this.itemCount--;
        this.keyMap.delete(key);
    }
    commit(firstKey, lastKey, isSSR = false) {
        if (this.frozen) throw new Error('Cannot commit a frozen collection');
        this.firstKey = firstKey;
        this.lastKey = lastKey;
        this.frozen = !isSSR;
    }
    filter(filterFn) {
        let newCollection = new this.constructor();
        let [firstKey, lastKey] = $0c55dae31ace3277$var$filterChildren(this, newCollection, this.firstKey, filterFn);
        newCollection === null || newCollection === void 0 ? void 0 : newCollection.commit(firstKey, lastKey);
        return newCollection;
    }
    constructor(){
        this.keyMap = new Map();
        this.firstKey = null;
        this.lastKey = null;
        this.frozen = false;
        this.itemCount = 0;
    }
}
function $0c55dae31ace3277$var$filterChildren(collection, newCollection, firstChildKey, filterFn) {
    // loop over the siblings for firstChildKey
    // create new nodes based on calling node.filter for each child
    // if it returns null then don't include it, otherwise update its prev/next keys
    // add them to the newCollection
    if (firstChildKey == null) return [
        null,
        null
    ];
    let firstNode = null;
    let lastNode = null;
    let currentNode = collection.getItem(firstChildKey);
    while(currentNode != null){
        let newNode = currentNode.filter(collection, newCollection, filterFn);
        if (newNode != null) {
            newNode.nextKey = null;
            if (lastNode) {
                newNode.prevKey = lastNode.key;
                lastNode.nextKey = newNode.key;
            }
            if (firstNode == null) firstNode = newNode;
            newCollection.addNode(newNode);
            lastNode = newNode;
        }
        currentNode = currentNode.nextKey != null ? collection.getItem(currentNode.nextKey) : null;
    }
    // TODO: this is pretty specific to dividers but doesn't feel like there is a good way to get around it since we only can know
    // to filter the last separator in a collection only after performing a filter for the rest of the contents after it
    // Its gross that it needs to live here, might be nice if somehow we could have this live in the separator code
    if (lastNode && lastNode.type === 'separator') {
        let prevKey = lastNode.prevKey;
        newCollection.removeNode(lastNode.key);
        if (prevKey != null) {
            lastNode = newCollection.getItem(prevKey);
            lastNode.nextKey = null;
        } else lastNode = null;
    }
    var _firstNode_key, _lastNode_key;
    return [
        (_firstNode_key = firstNode === null || firstNode === void 0 ? void 0 : firstNode.key) !== null && _firstNode_key !== void 0 ? _firstNode_key : null,
        (_lastNode_key = lastNode === null || lastNode === void 0 ? void 0 : lastNode.key) !== null && _lastNode_key !== void 0 ? _lastNode_key : null
    ];
}


export {$0c55dae31ace3277$export$d68d59712b04d9d1 as CollectionNode, $0c55dae31ace3277$export$b1918e978f1ee46f as FilterableNode, $0c55dae31ace3277$export$5ae2504e948afce5 as HeaderNode, $0c55dae31ace3277$export$8258a0665a675899 as LoaderNode, $0c55dae31ace3277$export$fd11f34e1d07f134 as ItemNode, $0c55dae31ace3277$export$437f11dc9b403b78 as SectionNode, $0c55dae31ace3277$export$408d25a4e12db025 as BaseCollection};
//# sourceMappingURL=BaseCollection.js.map
