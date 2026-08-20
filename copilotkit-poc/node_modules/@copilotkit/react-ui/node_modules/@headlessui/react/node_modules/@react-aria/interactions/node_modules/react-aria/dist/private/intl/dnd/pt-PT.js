var $ad6e2aeb54f36cfd$exports = {};
$ad6e2aeb54f36cfd$exports = {
    "dragDescriptionKeyboard": `Prima Enter para iniciar o arrasto.`,
    "dragDescriptionKeyboardAlt": `Prima Alt + Enter para iniciar o arrasto.`,
    "dragDescriptionLongPress": `Prima longamente para come\xe7ar a arrastar.`,
    "dragDescriptionTouch": `Fa\xe7a duplo toque para come\xe7ar a arrastar.`,
    "dragDescriptionVirtual": `Clique para iniciar o arrasto.`,
    "dragItem": (args)=>`Arrastar ${args.itemText}`,
    "dragSelectedItems": (args, formatter)=>`Arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} item selecionado`,
            other: ()=>`${formatter.number(args.count)} itens selecionados`
        })}`,
    "dragSelectedKeyboard": (args, formatter)=>`Prima Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedKeyboardAlt": (args, formatter)=>`Prima Alt + Enter para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragSelectedLongPress": (args, formatter)=>`Prima longamente para arrastar ${formatter.plural(args.count, {
            one: ()=>`${formatter.number(args.count)} o item selecionado`,
            other: ()=>`${formatter.number(args.count)} os itens selecionados`
        })}.`,
    "dragStartedKeyboard": `Arrasto iniciado. Prima a tecla de tabula\xe7\xe3o para navegar para um destino para largar, e em seguida prima Enter para largar ou prima Escape para cancelar.`,
    "dragStartedTouch": `Arrasto iniciado. Navegue para um destino para largar, e em seguida fa\xe7a duplo toque para largar.`,
    "dragStartedVirtual": `Arrasto iniciado. Navegue para um destino para largar, e em seguida clique ou prima Enter para largar.`,
    "dropCanceled": `Largar cancelado.`,
    "dropComplete": `Largar completo.`,
    "dropDescriptionKeyboard": `Prima Enter para largar. Prima Escape para cancelar o arrasto.`,
    "dropDescriptionTouch": `Fa\xe7a duplo toque para largar.`,
    "dropDescriptionVirtual": `Clique para largar.`,
    "dropIndicator": `Indicador de largar`,
    "dropOnItem": (args)=>`Largar em ${args.itemText}`,
    "dropOnRoot": `Largar em`,
    "endDragKeyboard": `A arrastar. Prima Enter para cancelar o arrasto.`,
    "endDragTouch": `A arrastar. Fa\xe7a duplo toque para cancelar o arrasto.`,
    "endDragVirtual": `A arrastar. Clique para cancelar o arrasto.`,
    "insertAfter": (args)=>`Inserir depois de ${args.itemText}`,
    "insertBefore": (args)=>`Inserir antes de ${args.itemText}`,
    "insertBetween": (args)=>`Inserir entre ${args.beforeItemText} e ${args.afterItemText}`
};


export {$ad6e2aeb54f36cfd$exports as default};
//# sourceMappingURL=pt-PT.js.map
