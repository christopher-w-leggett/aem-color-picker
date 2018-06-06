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
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
        },

        execute: function(execDef){
            var root = execDef.editContext.root,
                range = CUI.rte.Selection.saveNativeSelection(execDef.editContext)
                    || CUI.rte.Selection.getLeadRange(execDef.editContext),
                documentFragment = document.createDocumentFragment(),
                writePointer = documentFragment,
                cursorNode = execDef.selection.startNode,
                containerNode = cursorNode.parentNode,
                i;

            //if no error parsing dom, convert top element
            if(execDef.value && execDef.value.tree && execDef.value.tree.length){
                if(execDef.value.createTree){
                    //build new block tree
                    for(i = 0; i < execDef.value.tree.length; i++){
                        writePointer = writePointer.appendChild(document.createElement(execDef.value.tree[i]));
                    }

                    //write temporary node for cursor selection
                    writePointer = writePointer.appendChild(document.createElement('br'));
                    writePointer.setAttribute('_rte_temp_br', 'brEOB');

                    //insert dom before container node
                    containerNode.parentNode.insertBefore(documentFragment, containerNode);

                    //remove container node.
                    containerNode.parentNode.removeChild(containerNode);

                    //select temporary node.
                    range.selectNode(writePointer);
                } else {
                    //find top most container node
                    while(containerNode.parentNode !== root){
                        containerNode = containerNode.parentNode;
                    }

                    //create new paragraph container
                    writePointer = writePointer.appendChild(document.createElement('p'));

                    //write temporary node for cursor selection
                    writePointer = writePointer.appendChild(document.createElement('br'));
                    writePointer.setAttribute('_rte_temp_br', 'brEOB');

                    //insert dom before container node
                    containerNode.parentNode.insertBefore(documentFragment, containerNode);

                    //remove container node.
                    containerNode.parentNode.removeChild(containerNode);

                    //select temporary node.
                    range.selectNode(writePointer);
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
