var $c0ef0fe810ff1221$exports = {};
$c0ef0fe810ff1221$exports = {
    "deselectedItem": (args)=>`${args.item} no seleccionado.`,
    "longPressToSelect": `Mantenga pulsado para abrir el modo de selecci\xf3n.`,
    "select": `Seleccionar`,
    "selectedAll": `Todos los elementos seleccionados.`,
    "selectedCount": (args, formatter)=>`${formatter.plural(args.count, {
            "=0": `Ning\xfan elemento seleccionado`,
            one: ()=>`${formatter.number(args.count)} elemento seleccionado`,
            other: ()=>`${formatter.number(args.count)} elementos seleccionados`
        })}.`,
    "selectedItem": (args)=>`${args.item} seleccionado.`
};


export {$c0ef0fe810ff1221$exports as default};
//# sourceMappingURL=es-ES.js.map
