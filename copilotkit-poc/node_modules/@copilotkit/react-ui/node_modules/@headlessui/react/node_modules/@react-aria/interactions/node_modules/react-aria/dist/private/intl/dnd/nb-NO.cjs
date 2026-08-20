module.exports = {
    "dragDescriptionKeyboard": `Trykk p\xe5 Enter for \xe5 begynne \xe5 dra.`,
    "dragDescriptionKeyboardAlt": `Trykk p\xe5 Alt + Enter for \xe5 begynne \xe5 dra.`,
    "dragDescriptionLongPress": `Trykk lenge for \xe5 begynne \xe5 dra.`,
    "dragDescriptionTouch": `Dobbelttrykk for \xe5 begynne \xe5 dra.`,
    "dragDescriptionVirtual": `Klikk for \xe5 begynne \xe5 dra.`,
    "dragItem": (args)=>`Dra ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} merket element`,
            other: ()=>`${formatter.number(args.count)} merkede elementer`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Trykk Enter for \xe5 dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Trykk p\xe5 Alt + Enter for \xe5 dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Trykk lenge for \xe5 dra ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragStartedKeyboard": `Begynte \xe5 dra. Trykk p\xe5 Tab for \xe5 navigere til et m\xe5l, og trykk deretter p\xe5 Enter for \xe5 slippe eller p\xe5 Esc for \xe5 avbryte.`,
    "dragStartedTouch": `Begynte \xe5 dra. Naviger til et m\xe5l, og dobbelttrykk for \xe5 slippe.`,
    "dragStartedVirtual": `Begynte \xe5 dra. Naviger til et m\xe5l, og klikk eller trykk p\xe5 Enter for \xe5 slippe.`,
    "dropCanceled": `Avbr\xf8t slipping.`,
    "dropComplete": `Slippingen er fullf\xf8rt.`,
    "dropDescriptionKeyboard": `Trykk p\xe5 Enter for \xe5 slippe. Trykk p\xe5 Esc hvis du vil avbryte draingen.`,
    "dropDescriptionTouch": `Dobbelttrykk for \xe5 slippe.`,
    "dropDescriptionVirtual": `Klikk for \xe5 slippe.`,
    "dropIndicator": `slippeindikator`,
    "dropOnItem": (args)=>`Slipp p\xe5 ${args.itemText}`,
    "dropOnRoot": `Slipp p\xe5`,
    "endDragKeyboard": `Drar. Trykk p\xe5 Enter hvis du vil avbryte.`,
    "endDragTouch": `Drar. Dobbelttrykk hvis du vil avbryte.`,
    "endDragVirtual": `Drar. Klikk hvis du vil avbryte.`,
    "insertAfter": (args)=>`Sett inn etter ${args.itemText}`,
    "insertBefore": (args)=>`Sett inn f\xf8r ${args.itemText}`,
    "insertBetween": (args)=>`Sett inn mellom ${args.beforeItemText} og ${args.afterItemText}`
};


//# sourceMappingURL=nb-NO.cjs.map
