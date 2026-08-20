var $f3a2335aaa92bf1f$exports = {};
$f3a2335aaa92bf1f$exports = {
    "buttonLabel": `Mostrar sugerencias`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} opci\xf3n`,
            other: ()=>`${formatter.number(args.optionCount)} opciones`
        })} disponible(s).`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Se ha unido al grupo ${args.groupTitle}, con ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} opci\xf3n`,
                    other: ()=>`${formatter.number(args.groupCount)} opciones`
                })}. `,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, seleccionado`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Sugerencias`,
    "selectedAnnouncement": (args)=>`${args.optionText}, seleccionado`
};


export {$f3a2335aaa92bf1f$exports as default};
//# sourceMappingURL=es-ES.js.map
