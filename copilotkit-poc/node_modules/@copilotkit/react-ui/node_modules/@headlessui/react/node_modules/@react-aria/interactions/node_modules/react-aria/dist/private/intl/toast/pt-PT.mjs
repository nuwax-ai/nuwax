var $07d656fdc0f49208$exports = {};
$07d656fdc0f49208$exports = {
    "close": `Fechar`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notifica\xe7\xe3o`,
            other: ()=>`${formatter.number(args.count)} notifica\xe7\xf5es`
        })}.`
};


export {$07d656fdc0f49208$exports as default};
//# sourceMappingURL=pt-PT.mjs.map
