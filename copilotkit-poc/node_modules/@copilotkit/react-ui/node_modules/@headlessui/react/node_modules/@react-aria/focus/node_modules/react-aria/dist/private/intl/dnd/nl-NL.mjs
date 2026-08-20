var $f7057ea97ab6e465$exports = {};
$f7057ea97ab6e465$exports = {
    "dragDescriptionKeyboard": `Druk op Enter om te slepen.`,
    "dragDescriptionKeyboardAlt": `Druk op Alt + Enter om te slepen.`,
    "dragDescriptionLongPress": `Houd lang ingedrukt om te slepen.`,
    "dragDescriptionTouch": `Dubbeltik om te slepen.`,
    "dragDescriptionVirtual": `Klik om met slepen te starten.`,
    "dragItem": (args)=>`${args.itemText} slepen`,
    "dragSelectedItems": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} slepen`,
    "dragSelectedKeyboard": (args, formatter)=>`Druk op Enter om ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} te slepen.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Druk op Alt + Enter om ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} te slepen.`,
    "dragSelectedLongPress": (args, formatter)=>`Houd lang ingedrukt om ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} geselecteerd item`,
            other: ()=>`${formatter.number(args.count)} geselecteerde items`
        })} te slepen.`,
    "dragStartedKeyboard": `Begonnen met slepen. Druk op Tab om naar een locatie te gaan. Druk dan op Enter om neer te zetten, of op Esc om te annuleren.`,
    "dragStartedTouch": `Begonnen met slepen. Ga naar de gewenste locatie en dubbeltik om neer te zetten.`,
    "dragStartedVirtual": `Begonnen met slepen. Ga naar de gewenste locatie en klik of druk op Enter om neer te zetten.`,
    "dropCanceled": `Neerzetten geannuleerd.`,
    "dropComplete": `Neerzetten voltooid.`,
    "dropDescriptionKeyboard": `Druk op Enter om neer te zetten. Druk op Esc om het slepen te annuleren.`,
    "dropDescriptionTouch": `Dubbeltik om neer te zetten.`,
    "dropDescriptionVirtual": `Klik om neer te zetten.`,
    "dropIndicator": `aanwijzer voor neerzetten`,
    "dropOnItem": (args)=>`Neerzetten op ${args.itemText}`,
    "dropOnRoot": `Neerzetten op`,
    "endDragKeyboard": `Bezig met slepen. Druk op Enter om te annuleren.`,
    "endDragTouch": `Bezig met slepen. Dubbeltik om te annuleren.`,
    "endDragVirtual": `Bezig met slepen. Klik om te annuleren.`,
    "insertAfter": (args)=>`Plaatsen na ${args.itemText}`,
    "insertBefore": (args)=>`Plaatsen v\xf3\xf3r ${args.itemText}`,
    "insertBetween": (args)=>`Plaatsen tussen ${args.beforeItemText} en ${args.afterItemText}`
};


export {$f7057ea97ab6e465$exports as default};
//# sourceMappingURL=nl-NL.mjs.map
