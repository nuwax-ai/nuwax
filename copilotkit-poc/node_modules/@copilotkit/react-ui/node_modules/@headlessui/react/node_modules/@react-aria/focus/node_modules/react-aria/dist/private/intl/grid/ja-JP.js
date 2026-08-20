var $52dc5b1656eed520$exports = {};
$52dc5b1656eed520$exports = {
    "deselectedItem": (args)=>`${args.item} \u{304C}\u{9078}\u{629E}\u{3055}\u{308C}\u{3066}\u{3044}\u{307E}\u{305B}\u{3093}\u{3002}`,
    "longPressToSelect": `\u{9577}\u{62BC}\u{3057}\u{3057}\u{3066}\u{9078}\u{629E}\u{30E2}\u{30FC}\u{30C9}\u{3092}\u{958B}\u{304D}\u{307E}\u{3059}\u{3002}`,
    "select": `\u{9078}\u{629E}`,
    "selectedAll": `\u{3059}\u{3079}\u{3066}\u{306E}\u{9805}\u{76EE}\u{3092}\u{9078}\u{629E}\u{3057}\u{307E}\u{3057}\u{305F}\u{3002}`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{9805}\u{76EE}\u{304C}\u{9078}\u{629E}\u{3055}\u{308C}\u{3066}\u{3044}\u{307E}\u{305B}\u{3093}`,
            one: ()=>`${formatter.number(args.count)} \u{9805}\u{76EE}\u{3092}\u{9078}\u{629E}\u{3057}\u{307E}\u{3057}\u{305F}`,
            other: ()=>`${formatter.number(args.count)} \u{9805}\u{76EE}\u{3092}\u{9078}\u{629E}\u{3057}\u{307E}\u{3057}\u{305F}`
        })}\u{3002}`,
    "selectedItem": (args)=>`${args.item} \u{3092}\u{9078}\u{629E}\u{3057}\u{307E}\u{3057}\u{305F}\u{3002}`
};


export {$52dc5b1656eed520$exports as default};
//# sourceMappingURL=ja-JP.js.map
