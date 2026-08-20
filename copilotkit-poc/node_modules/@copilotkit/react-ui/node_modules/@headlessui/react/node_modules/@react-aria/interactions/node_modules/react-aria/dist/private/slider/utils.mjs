const $b2a66ce670b3f60f$export$d6c8d9636a3dc49c = new WeakMap();
function $b2a66ce670b3f60f$export$68e648cbec363a18(state, index) {
    let data = $b2a66ce670b3f60f$export$d6c8d9636a3dc49c.get(state);
    if (!data) throw new Error('Unknown slider state');
    return `${data.id}-${index}`;
}


export {$b2a66ce670b3f60f$export$d6c8d9636a3dc49c as sliderData, $b2a66ce670b3f60f$export$68e648cbec363a18 as getSliderThumbId};
//# sourceMappingURL=utils.mjs.map
