const $1b9c3fe237249a6a$export$d6c8d9636a3dc49c = new WeakMap();
function $1b9c3fe237249a6a$export$68e648cbec363a18(state, index) {
    let data = $1b9c3fe237249a6a$export$d6c8d9636a3dc49c.get(state);
    if (!data) throw new Error('Unknown slider state');
    return `${data.id}-${index}`;
}


export {$1b9c3fe237249a6a$export$d6c8d9636a3dc49c as sliderData, $1b9c3fe237249a6a$export$68e648cbec363a18 as getSliderThumbId};
//# sourceMappingURL=utils.js.map
