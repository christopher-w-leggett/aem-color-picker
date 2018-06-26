RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    var GROUP = 'auto',
        COMMAND_NAME = 'auto-block-format';

    RTEExt.rte.commands.AutoBlockFormatting = new Class({
        toString: 'AutoBlockFormatting',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION;
        },

        execute: function(execDef){
            var root = execDef.editContext.root,
                documentFragment = document.createDocumentFragment(),
                writePointer = documentFragment,
                cursorNode = execDef.selection.startNode,
                containerNode = cursorNode.parentNode,
                emptyPlaceholderNode,
                i;

            //continue if we were provided a formatting tree
            if(execDef.value && execDef.value.tree && execDef.value.tree.length){
                if(execDef.value.createTree){
                    //build new block tree
                    for(i = 0; i < execDef.value.tree.length; i++){
                        writePointer = writePointer.appendChild(document.createElement(execDef.value.tree[i]));
                    }

                    //get temporary node for cursor selection if needed
                    emptyPlaceholderNode = CUI.rte.DomProcessor.createEmptyLinePlaceholder(execDef.editContext, false);
                    if(emptyPlaceholderNode){
                        writePointer = writePointer.appendChild(emptyPlaceholderNode);
                    }

                    //insert dom before container node
                    containerNode.parentNode.insertBefore(documentFragment, containerNode);

                    //remove container node.
                    containerNode.parentNode.removeChild(containerNode);
                } else {
                    //find top most container node
                    while(containerNode.parentNode !== root){
                        containerNode = containerNode.parentNode;
                    }

                    //create new paragraph container
                    writePointer = writePointer.appendChild(document.createElement(
                        execDef.component.htmlRules.blockHandling.defaultEditBlockType
                    ));

                    //get temporary node for cursor selection if needed
                    emptyPlaceholderNode = CUI.rte.DomProcessor.createEmptyLinePlaceholder(execDef.editContext, false);
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
