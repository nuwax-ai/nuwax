module.exports = {
    "dragDescriptionKeyboard": `Pritisnite Enter da biste po\u{10D}eli povla\u{10D}iti.`,
    "dragDescriptionKeyboardAlt": `Pritisnite Alt + Enter za po\u{10D}etak povla\u{10D}enja.`,
    "dragDescriptionLongPress": `Dugo pritisnite za po\u{10D}etak povla\u{10D}enja.`,
    "dragDescriptionTouch": `Dvaput dodirnite da biste po\u{10D}eli povla\u{10D}iti.`,
    "dragDescriptionVirtual": `Kliknite da biste po\u{10D}eli povla\u{10D}iti.`,
    "dragItem": (args)=>`Povucite stavku ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Povucite ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabranu stavku`,
            other: ()=>`ovoliko odabranih stavki: ${formatter.number(args.count)}`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Pritisnite Enter za povla\u{10D}enje ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabrana stavka`,
            other: ()=>`${formatter.number(args.count)} odabrane stavke`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Pritisnite Alt + Enter za povla\u{10D}enje ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabrana stavka`,
            other: ()=>`${formatter.number(args.count)} odabrane stavke`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Dugo pritisnite za povla\u{10D}enje ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} odabrana stavka`,
            other: ()=>`${formatter.number(args.count)} odabrane stavke`
        })}.`,
    "dragStartedKeyboard": `Po\u{10D}eli ste povla\u{10D}iti. Pritisnite tipku tabulatora da biste do\u{161}li do cilja ispu\u{161}tanja, a zatim Enter da biste ispustili stavku ili Escape da biste prekinuli povla\u{10D}enje.`,
    "dragStartedTouch": `Po\u{10D}eli ste povla\u{10D}iti. Do\u{111}ite do cilja ispu\u{161}tanja, a zatim dvaput dodirnite da biste ispustili stavku.`,
    "dragStartedVirtual": `Po\u{10D}eli ste povla\u{10D}iti. Do\u{111}ite do cilja ispu\u{161}tanja, a zatim kliknite ili pritisnite Enter da biste ispustili stavku.`,
    "dropCanceled": `Povla\u{10D}enje je prekinuto.`,
    "dropComplete": `Ispu\u{161}tanje je dovr\u{161}eno.`,
    "dropDescriptionKeyboard": `Pritisnite Enter da biste ispustili stavku. Pritisnite Escape da biste prekinuli povla\u{10D}enje.`,
    "dropDescriptionTouch": `Dvaput dodirnite da biste ispustili stavku.`,
    "dropDescriptionVirtual": `Kliknite da biste ispustili stavku.`,
    "dropIndicator": `pokazatelj ispu\u{161}tanja`,
    "dropOnItem": (args)=>`Ispustite na stavku ${args.itemText}`,
    "dropOnRoot": `Ispustite na`,
    "endDragKeyboard": `Povla\u{10D}enje. Pritisnite Enter da biste prekinuli povla\u{10D}enje.`,
    "endDragTouch": `Povla\u{10D}enje. Dvaput dodirnite da biste prekinuli povla\u{10D}enje.`,
    "endDragVirtual": `Povla\u{10D}enje. Kliknite da biste prekinuli povla\u{10D}enje.`,
    "insertAfter": (args)=>`Umetnite iza stavke ${args.itemText}`,
    "insertBefore": (args)=>`Ispustite ispred stavke ${args.itemText}`,
    "insertBetween": (args)=>`Umetnite izme\u{111}u stavki ${args.beforeItemText} i ${args.afterItemText}`
};


//# sourceMappingURL=hr-HR.cjs.map
