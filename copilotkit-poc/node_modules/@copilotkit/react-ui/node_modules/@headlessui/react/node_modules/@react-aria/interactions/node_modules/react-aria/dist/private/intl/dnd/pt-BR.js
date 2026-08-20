var $0da3db770fa1858f$exports = {};
$0da3db770fa1858f$exports = {
    "dragDescriptionKeyboard": `Pressione Enter para come\xe7ar a arrastar.`,
    "dragDescriptionKeyboardAlt": `Pressione Alt + Enter para come\xe7ar a arrastar.`,
    "dragDescriptionLongPress": `Pressione e segure para come\xe7ar a arrastar.`,
    "dragDescriptionTouch": `Toque duas vezes para come\xe7ar a arrastar.`,
    "dragDescriptionVirtual": `Clique para come\xe7ar a arrastar.`,
    "dragItem": (args)=>`Arrastar ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Pressione Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Pressione Alt + Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Pressione e segure para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragStartedKeyboard": `Comece a arrastar. Pressione Tab para navegar at\xe9 um alvo e, em seguida, pressione Enter para soltar ou pressione Escape para cancelar.`,
    "dragStartedTouch": `Comece a arrastar. Navegue at\xe9 um alvo e toque duas vezes para soltar.`,
    "dragStartedVirtual": `Comece a arrastar. Navegue at\xe9 um alvo e clique ou pressione Enter para soltar.`,
    "dropCanceled": `Libera\xe7\xe3o cancelada.`,
    "dropComplete": `Libera\xe7\xe3o conclu\xedda.`,
    "dropDescriptionKeyboard": `Pressione Enter para soltar. Pressione Escape para cancelar.`,
    "dropDescriptionTouch": `Toque duas vezes para soltar.`,
    "dropDescriptionVirtual": `Clique para soltar.`,
    "dropIndicator": `indicador de libera\xe7\xe3o`,
    "dropOnItem": (args)=>`Soltar em ${args.itemText}`,
    "dropOnRoot": `Soltar`,
    "endDragKeyboard": `Arrastando. Pressione Enter para cancelar.`,
    "endDragTouch": `Arrastando. Toque duas vezes para cancelar.`,
    "endDragVirtual": `Arrastando. Clique para cancelar.`,
    "insertAfter": (args)=>`Inserir ap\xf3s ${args.itemText}`,
    "insertBefore": (args)=>`Inserir antes de ${args.itemText}`,
    "insertBetween": (args)=>`Inserir entre ${args.beforeItemText} e ${args.afterItemText}`
};


export {$0da3db770fa1858f$exports as default};
//# sourceMappingURL=pt-BR.js.map
