var $bd6a99cdbbb54d0f$exports = {};
$bd6a99cdbbb54d0f$exports = {
    "close": `Fechar`,
    "notifications": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} notifica\xe7\xe3o`,
            other: ()=>`${formatter.number(args.count)} notifica\xe7\xf5es`
        })}.`
};


export {$bd6a99cdbbb54d0f$exports as default};
//# sourceMappingURL=pt-BR.js.map
