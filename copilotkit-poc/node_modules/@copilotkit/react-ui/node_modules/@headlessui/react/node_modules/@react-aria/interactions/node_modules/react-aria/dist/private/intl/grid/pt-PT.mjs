var $bb732f27f34b6026$exports = {};
$bb732f27f34b6026$exports = {
    "deselectedItem": (args)=>`${args.item} n\xe3o selecionado.`,
    "longPressToSelect": `Prima continuamente para entrar no modo de sele\xe7\xe3o.`,
    "select": `Selecionar`,
    "selectedAll": `Todos os itens selecionados.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nenhum item selecionado`,
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}.`,
    "selectedItem": (args)=>`${args.item} selecionado.`
};


export {$bb732f27f34b6026$exports as default};
//# sourceMappingURL=pt-PT.mjs.map
