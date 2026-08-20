module.exports = {
    "dragDescriptionKeyboard": `Tryk p\xe5 Enter for at starte med at tr\xe6kke.`,
    "dragDescriptionKeyboardAlt": `Tryk p\xe5 Alt + Enter for at starte med at tr\xe6kke.`,
    "dragDescriptionLongPress": `Tryk l\xe6nge for at starte med at tr\xe6kke.`,
    "dragDescriptionTouch": `Dobbelttryk for at starte med at tr\xe6kke.`,
    "dragDescriptionVirtual": `Klik for at starte med at tr\xe6kke.`,
    "dragItem": (args)=>`Tr\xe6k ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Tr\xe6k ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgt element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Tryk p\xe5 Enter for at tr\xe6kke ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgte element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Tryk p\xe5 Alt + Enter for at tr\xe6kke ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgte element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Tryk l\xe6nge for at tr\xe6kke ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valgte element`,
            other: ()=>`${formatter.number(args.count)} valgte elementer`
        })}.`,
    "dragStartedKeyboard": `Startet med at tr\xe6kke. Tryk p\xe5 Tab for at g\xe5 til et slip-m\xe5l, tryk derefter p\xe5 Enter for at slippe, eller tryk p\xe5 Escape for at annullere.`,
    "dragStartedTouch": `Startet med at tr\xe6kke. G\xe5 til et slip-m\xe5l, og dobbelttryk derefter for at slippe.`,
    "dragStartedVirtual": `Startet med at tr\xe6kke. G\xe5 til et slip-m\xe5l, og klik eller tryk derefter p\xe5 enter for at slippe.`,
    "dropCanceled": `Slip annulleret.`,
    "dropComplete": `Slip fuldf\xf8rt.`,
    "dropDescriptionKeyboard": `Tryk p\xe5 Enter for at slippe. Tryk p\xe5 Escape for at annullere tr\xe6kning.`,
    "dropDescriptionTouch": `Dobbelttryk for at slippe.`,
    "dropDescriptionVirtual": `Klik for at slippe.`,
    "dropIndicator": `slip-indikator`,
    "dropOnItem": (args)=>`Slip p\xe5 ${args.itemText}`,
    "dropOnRoot": `Slip p\xe5`,
    "endDragKeyboard": `Tr\xe6kning. Tryk p\xe5 enter for at annullere tr\xe6k.`,
    "endDragTouch": `Tr\xe6kning. Dobbelttryk for at annullere tr\xe6k.`,
    "endDragVirtual": `Tr\xe6kning. Klik for at annullere tr\xe6kning.`,
    "insertAfter": (args)=>`Inds\xe6t efter ${args.itemText}`,
    "insertBefore": (args)=>`Inds\xe6t f\xf8r ${args.itemText}`,
    "insertBetween": (args)=>`Inds\xe6t mellem ${args.beforeItemText} og ${args.afterItemText}`
};


//# sourceMappingURL=da-DK.cjs.map
