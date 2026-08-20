var $9344434950192959$exports = {};
$9344434950192959$exports = {
    "dragDescriptionKeyboard": `Lohistamise alustamiseks vajutage klahvi Enter.`,
    "dragDescriptionKeyboardAlt": `Lohistamise alustamiseks vajutage klahvikombinatsiooni Alt + Enter.`,
    "dragDescriptionLongPress": `Vajutage pikalt lohistamise alustamiseks.`,
    "dragDescriptionTouch": `Topeltpuudutage lohistamise alustamiseks.`,
    "dragDescriptionVirtual": `Kl\xf5psake lohistamise alustamiseks.`,
    "dragItem": (args)=>`Lohista ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Lohista ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud \xfcksust`,
            other: ()=>`${formatter.number(args.count)} valitud \xfcksust`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud \xfcksuse`,
            other: ()=>`${formatter.number(args.count)} valitud \xfcksuse`
        })} lohistamiseks vajutage sisestusklahvi Enter.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Lohistamiseks vajutage klahvikombinatsiooni Alt + Enter ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud \xfcksuse`,
            other: ()=>`${formatter.number(args.count)} valitud \xfcksuse`
        })} jaoks.`,
    "dragSelectedLongPress": (args, formatter)=>`Pikk vajutus ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} valitud \xfcksuse`,
            other: ()=>`${formatter.number(args.count)} valitud \xfcksuse`
        })} lohistamiseks.`,
    "dragStartedKeyboard": `Alustati lohistamist. Kukutamise sihtm\xe4rgi juurde navigeerimiseks vajutage klahvi Tab, seej\xe4rel vajutage kukutamiseks klahvi Enter v\xf5i loobumiseks klahvi Escape.`,
    "dragStartedTouch": `Alustati lohistamist. Navigeerige kukutamise sihtm\xe4rgi juurde ja topeltpuudutage kukutamiseks.`,
    "dragStartedVirtual": `Alustati lohistamist. Navigeerige kukutamise sihtm\xe4rgi juurde ja kukutamiseks kl\xf5psake v\xf5i vajutage klahvi Enter.`,
    "dropCanceled": `Lohistamisest loobuti.`,
    "dropComplete": `Lohistamine on tehtud.`,
    "dropDescriptionKeyboard": `Kukutamiseks vajutage klahvi Enter. Lohistamisest loobumiseks vajutage klahvi Escape.`,
    "dropDescriptionTouch": `Kukutamiseks topeltpuudutage.`,
    "dropDescriptionVirtual": `Kukutamiseks kl\xf5psake.`,
    "dropIndicator": `lohistamise indikaator`,
    "dropOnItem": (args)=>`Kukuta asukohta ${args.itemText}`,
    "dropOnRoot": `Kukuta asukohta`,
    "endDragKeyboard": `Lohistamine. Lohistamisest loobumiseks vajutage klahvi Enter.`,
    "endDragTouch": `Lohistamine. Lohistamisest loobumiseks topeltpuudutage.`,
    "endDragVirtual": `Lohistamine. Lohistamisest loobumiseks kl\xf5psake.`,
    "insertAfter": (args)=>`Sisesta ${args.itemText} j\xe4rele`,
    "insertBefore": (args)=>`Sisesta ${args.itemText} ette`,
    "insertBetween": (args)=>`Sisesta ${args.beforeItemText} ja ${args.afterItemText} vahele`
};


export {$9344434950192959$exports as default};
//# sourceMappingURL=et-EE.js.map
