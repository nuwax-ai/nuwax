var $d390cc18eaec7831$exports = {};
$d390cc18eaec7831$exports = {
    "deselectedItem": (args)=>`${args.item} n\xe3o selecionado.`,
    "longPressToSelect": `Mantenha pressionado para entrar no modo de sele\xe7\xe3o.`,
    "select": `Selecionar`,
    "selectedAll": `Todos os itens selecionados.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Nenhum item selecionado`,
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}.`,
    "selectedItem": (args)=>`${args.item} selecionado.`
};


export {$d390cc18eaec7831$exports as default};
//# sourceMappingURL=pt-BR.js.map
