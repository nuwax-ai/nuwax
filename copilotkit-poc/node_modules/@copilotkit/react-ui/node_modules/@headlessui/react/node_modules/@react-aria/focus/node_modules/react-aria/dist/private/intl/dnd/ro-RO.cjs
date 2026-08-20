module.exports = {
    "dragDescriptionKeyboard": `Ap\u{103}sa\u{21B}i pe Enter pentru a \xeencepe glisarea.`,
    "dragDescriptionKeyboardAlt": `Ap\u{103}sa\u{21B}i pe Alt + Enter pentru a \xeencepe glisarea.`,
    "dragDescriptionLongPress": `Ap\u{103}sa\u{21B}i lung pentru a \xeencepe glisarea.`,
    "dragDescriptionTouch": `Atinge\u{21B}i de dou\u{103} ori pentru a \xeencepe s\u{103} glisa\u{21B}i.`,
    "dragDescriptionVirtual": `Face\u{21B}i clic pentru a \xeencepe glisarea.`,
    "dragItem": (args)=>`Glisa\u{21B}i ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Glisa\u{21B}i ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Ap\u{103}sa\u{21B}i pe Enter pentru a glisa ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Ap\u{103}sa\u{21B}i pe Alt + Enter pentru a glisa ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Ap\u{103}sa\u{21B}i lung pentru a glisa ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} element selectat`,
            other: ()=>`${formatter.number(args.count)} elemente selectate`
        })}.`,
    "dragStartedKeyboard": `A \xeenceput glisarea. Ap\u{103}sa\u{21B}i pe Tab pentru a naviga la o \u{21B}int\u{103} de fixare, apoi ap\u{103}sa\u{21B}i pe Enter pentru a fixa sau ap\u{103}sa\u{21B}i pe Escape pentru a anula glisarea.`,
    "dragStartedTouch": `A \xeenceput glisarea. Naviga\u{21B}i la o \u{21B}int\u{103} de fixare, apoi atinge\u{21B}i de dou\u{103} ori pentru a fixa.`,
    "dragStartedVirtual": `A \xeenceput glisarea. Naviga\u{21B}i la o \u{21B}int\u{103} de fixare, apoi face\u{21B}i clic sau ap\u{103}sa\u{21B}i pe Enter pentru a fixa.`,
    "dropCanceled": `Fixare anulat\u{103}.`,
    "dropComplete": `Fixare finalizat\u{103}.`,
    "dropDescriptionKeyboard": `Ap\u{103}sa\u{21B}i pe Enter pentru a fixa. Ap\u{103}sa\u{21B}i pe Escape pentru a anula glisarea.`,
    "dropDescriptionTouch": `Atinge\u{21B}i de dou\u{103} ori pentru a fixa.`,
    "dropDescriptionVirtual": `Face\u{21B}i clic pentru a fixa.`,
    "dropIndicator": `indicator de fixare`,
    "dropOnItem": (args)=>`Fixa\u{21B}i pe ${args.itemText}`,
    "dropOnRoot": `Fixare pe`,
    "endDragKeyboard": `Se gliseaz\u{103}. Ap\u{103}sa\u{21B}i pe Enter pentru a anula glisarea.`,
    "endDragTouch": `Se gliseaz\u{103}. Atinge\u{21B}i de dou\u{103} ori pentru a anula glisarea.`,
    "endDragVirtual": `Se gliseaz\u{103}. Face\u{21B}i clic pentru a anula glisarea.`,
    "insertAfter": (args)=>`Insera\u{21B}i dup\u{103} ${args.itemText}`,
    "insertBefore": (args)=>`Insera\u{21B}i \xeenainte de ${args.itemText}`,
    "insertBetween": (args)=>`Insera\u{21B}i \xeentre ${args.beforeItemText} \u{219}i ${args.afterItemText}`
};


//# sourceMappingURL=ro-RO.cjs.map
