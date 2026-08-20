module.exports = {
    "dragDescriptionKeyboard": `Tryck p\xe5 enter f\xf6r att b\xf6rja dra.`,
    "dragDescriptionKeyboardAlt": `Tryck p\xe5 Alt + Retur f\xf6r att b\xf6rja dra.`,
    "dragDescriptionLongPress": `Tryck l\xe4nge f\xf6r att b\xf6rja dra.`,
    "dragDescriptionTouch": `Dubbeltryck f\xf6r att b\xf6rja dra.`,
    "dragDescriptionVirtual": `Klicka f\xf6r att b\xf6rja dra.`,
    "dragItem": (args)=>`Dra ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valt objekt`,
            other: ()=>`${formatter.number(args.count)} valda objekt`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Tryck p\xe5 Retur f\xf6r att dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Tryck p\xe5 Alt + Retur f\xf6r att dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Tryck l\xe4nge f\xf6r att dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} markerat objekt`,
            other: ()=>`${formatter.number(args.count)} markerade objekt`
        })}.`,
    "dragStartedKeyboard": `B\xf6rja dra. Tryck p\xe5 tabb f\xf6r att navigera till m\xe5let, tryck p\xe5 enter f\xf6r att sl\xe4ppa eller p\xe5 escape f\xf6r att avbryta.`,
    "dragStartedTouch": `B\xf6rja dra. Navigera till ett m\xe5l och dubbeltryck f\xf6r att sl\xe4ppa.`,
    "dragStartedVirtual": `B\xf6rja dra. Navigera till ett m\xe5l och klicka eller tryck p\xe5 enter f\xf6r att sl\xe4ppa.`,
    "dropCanceled": `Sl\xe4pp\xe5tg\xe4rd avbr\xf6ts.`,
    "dropComplete": `Sl\xe4pp\xe5tg\xe4rd klar.`,
    "dropDescriptionKeyboard": `Tryck p\xe5 enter f\xf6r att sl\xe4ppa. Tryck p\xe5 escape f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    "dropDescriptionTouch": `Dubbeltryck f\xf6r att sl\xe4ppa.`,
    "dropDescriptionVirtual": `Klicka f\xf6r att sl\xe4ppa.`,
    "dropIndicator": `sl\xe4ppindikator`,
    "dropOnItem": (args)=>`Sl\xe4pp p\xe5 ${args.itemText}`,
    "dropOnRoot": `Sl\xe4pp p\xe5`,
    "endDragKeyboard": `Drar. Tryck p\xe5 enter f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    "endDragTouch": `Drar. Dubbeltryck f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    "endDragVirtual": `Drar. Klicka f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    "insertAfter": (args)=>`Infoga efter ${args.itemText}`,
    "insertBefore": (args)=>`Infoga f\xf6re ${args.itemText}`,
    "insertBetween": (args)=>`Infoga mellan ${args.beforeItemText} och ${args.afterItemText}`
};


//# sourceMappingURL=sv-SE.cjs.map
