RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    const COMMAND_NAME = 'auto-block-format';

    RTEExt.rte.commands.AutoBlockFormatting = new Class({
        toString: 'AutoBlockFormatting',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            const cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION;
        },

        execute: function(execDef){
            //continue if we were provided a formatting tree
            if(execDef.value && execDef.value.tree && execDef.value.tree.length){
                const documentFragment = execDef.editContext.doc.createDocumentFragment(),
                    cursorNode = execDef.selection.startNode;
                let writePointer = documentFragment,
                    containerNode = cursorNode.parentNode;

                if(execDef.value.createTree){
                    //build new block tree
                    for(let i = 0; i < execDef.value.tree.length; i++){
                        writePointer = writePointer.appendChild(
                            execDef.editContext.doc.createElement(execDef.value.tree[i])
                        );
                    }

                    //get temporary node for cursor selection if needed
                    const emptyPlaceholderNode = CUI.rte.DomProcessor.createEmptyLinePlaceholder(execDef.editContext, false);
                    if(emptyPlaceholderNode){
                        writePointer = writePointer.appendChild(emptyPlaceholderNode);
                    }

                    //insert dom before container node
                    containerNode.parentNode.insertBefore(documentFragment, containerNode);

                    //remove container node.
                    containerNode.parentNode.removeChild(containerNode);

                    //update bookmark
                    execDef.bookmark.startPos -= containerNode.innerText.length;
                } else {
                    //find top most container node
                    while(containerNode.parentNode !== execDef.editContext.root){
                        containerNode = containerNode.parentNode;
                    }

                    //create new paragraph container
                    writePointer = writePointer.appendChild(execDef.editContext.doc.createElement(
                        execDef.component.htmlRules.blockHandling.defaultEditBlockType
                    ));

                    //get temporary node for cursor selection if needed
                    const emptyPlaceholderNode = CUI.rte.DomProcessor.createEmptyLinePlaceholder(execDef.editContext, false);
                    if(emptyPlaceholderNode){
                        writePointer = writePointer.appendChild(emptyPlaceholderNode);
                    }

                    //insert dom before container node
                    containerNode.parentNode.insertBefore(documentFragment, containerNode);

                    //remove container node.
                    containerNode.parentNode.removeChild(containerNode);
                }
            }
        }
    });

    RTEExt.rte.commands.AutoBlockFormatting.COMMAND_NAME = COMMAND_NAME;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.AutoBlockFormatting
    );
})(window.CUI);
