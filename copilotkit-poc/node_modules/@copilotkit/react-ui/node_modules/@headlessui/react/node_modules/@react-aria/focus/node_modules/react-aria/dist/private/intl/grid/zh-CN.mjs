var $e2dc74d09d9623e5$exports = {};
$e2dc74d09d9623e5$exports = {
    "deselectedItem": (args)=>`\u{672A}\u{9009}\u{62E9} ${args.item}\u{3002}`,
    "longPressToSelect": `\u{957F}\u{6309}\u{4EE5}\u{8FDB}\u{5165}\u{9009}\u{62E9}\u{6A21}\u{5F0F}\u{3002}`,
    "select": `\u{9009}\u{62E9}`,
    "selectedAll": `\u{5DF2}\u{9009}\u{62E9}\u{6240}\u{6709}\u{9879}\u{76EE}\u{3002}`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{672A}\u{9009}\u{62E9}\u{9879}\u{76EE}`,
            one: ()=>`\u{5DF2}\u{9009}\u{62E9} ${formatter.number(args.count)} \u{4E2A}\u{9879}\u{76EE}`,
            other: ()=>`\u{5DF2}\u{9009}\u{62E9} ${formatter.number(args.count)} \u{4E2A}\u{9879}\u{76EE}`
        })}\u{3002}`,
    "selectedItem": (args)=>`\u{5DF2}\u{9009}\u{62E9} ${args.item}\u{3002}`
};


export {$e2dc74d09d9623e5$exports as default};
//# sourceMappingURL=zh-CN.mjs.map
