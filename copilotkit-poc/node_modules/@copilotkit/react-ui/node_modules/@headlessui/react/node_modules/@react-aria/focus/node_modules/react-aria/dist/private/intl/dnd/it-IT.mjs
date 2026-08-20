var $ca5378f9bbb255fa$exports = {};
$ca5378f9bbb255fa$exports = {
    "dragDescriptionKeyboard": `Premi Invio per iniziare a trascinare.`,
    "dragDescriptionKeyboardAlt": `Premi Alt + Invio per iniziare a trascinare.`,
    "dragDescriptionLongPress": `Premi a lungo per iniziare a trascinare.`,
    "dragDescriptionTouch": `Tocca due volte per iniziare a trascinare.`,
    "dragDescriptionVirtual": `Fai clic per iniziare a trascinare.`,
    "dragItem": (args)=>`Trascina ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Trascina ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} altro elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} altri elementi selezionati`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Premi Invio per trascinare ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Premi Alt + Invio per trascinare ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Premi a lungo per trascinare ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} elemento selezionato`,
            other: ()=>`${formatter.number(args.count)} elementi selezionati`
        })}.`,
    "dragStartedKeyboard": `Hai iniziato a trascinare. Premi Tab per arrivare sull\u{2019}area di destinazione, quindi premi Invio per rilasciare o Esc per annullare.`,
    "dragStartedTouch": `Hai iniziato a trascinare. Arriva sull\u{2019}area di destinazione, quindi tocca due volte per rilasciare.`,
    "dragStartedVirtual": `Hai iniziato a trascinare. Arriva sull\u{2019}area di destinazione, quindi fai clic o premi Invio per rilasciare.`,
    "dropCanceled": `Rilascio annullato.`,
    "dropComplete": `Rilascio completato.`,
    "dropDescriptionKeyboard": `Premi Invio per rilasciare. Premi Esc per annullare.`,
    "dropDescriptionTouch": `Tocca due volte per rilasciare.`,
    "dropDescriptionVirtual": `Fai clic per rilasciare.`,
    "dropIndicator": `indicatore di rilascio`,
    "dropOnItem": (args)=>`Rilascia su ${args.itemText}`,
    "dropOnRoot": `Rilascia su`,
    "endDragKeyboard": `Trascinamento. Premi Invio per annullare.`,
    "endDragTouch": `Trascinamento. Tocca due volte per annullare.`,
    "endDragVirtual": `Trascinamento. Fai clic per annullare.`,
    "insertAfter": (args)=>`Inserisci dopo ${args.itemText}`,
    "insertBefore": (args)=>`Inserisci prima di ${args.itemText}`,
    "insertBetween": (args)=>`Inserisci tra ${args.beforeItemText} e ${args.afterItemText}`
};


export {$ca5378f9bbb255fa$exports as default};
//# sourceMappingURL=it-IT.mjs.map
