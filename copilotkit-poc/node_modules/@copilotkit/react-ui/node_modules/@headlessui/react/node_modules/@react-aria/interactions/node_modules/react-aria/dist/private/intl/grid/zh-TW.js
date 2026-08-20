var $2d894e41777d8bdc$exports = {};
$2d894e41777d8bdc$exports = {
    "deselectedItem": (args)=>`\u{672A}\u{9078}\u{53D6}\u{300C}${args.item}\u{300D}\u{3002}`,
    "longPressToSelect": `\u{9577}\u{6309}\u{4EE5}\u{9032}\u{5165}\u{9078}\u{64C7}\u{6A21}\u{5F0F}\u{3002}`,
    "select": `\u{9078}\u{53D6}`,
    "selectedAll": `\u{5DF2}\u{9078}\u{53D6}\u{6240}\u{6709}\u{9805}\u{76EE}\u{3002}`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `\u{672A}\u{9078}\u{53D6}\u{4EFB}\u{4F55}\u{9805}\u{76EE}`,
            one: ()=>`\u{5DF2}\u{9078}\u{53D6} ${formatter.number(args.count)} \u{500B}\u{9805}\u{76EE}`,
            other: ()=>`\u{5DF2}\u{9078}\u{53D6} ${formatter.number(args.count)} \u{500B}\u{9805}\u{76EE}`
        })}\u{3002}`,
    "selectedItem": (args)=>`\u{5DF2}\u{9078}\u{53D6}\u{300C}${args.item}\u{300D}\u{3002}`
};


export {$2d894e41777d8bdc$exports as default};
//# sourceMappingURL=zh-TW.js.map
