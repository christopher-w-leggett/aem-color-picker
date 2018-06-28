RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    var COMMAND_NAME = 'format-ext';

    RTEExt.rte.commands.FormatExt = new Class({
        toString: 'FormatExt',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION;
        },

        execute: function(execDef){
            var stylingTagName = execDef.value.tagName,
                startNode = execDef.selection.startNode,
                endNode = execDef.selection.endNode,
                root = execDef.editContext.root,
                actingRoot = RTEExt.rte.Utils.getCommonAncestor(startNode, endNode, root, function(node){
                    return node.tagName && RTEExt.rte.Utils.isContainerNode(node);
                }),
                generator = new RTEExt.rte.selection.pipeline.HtmlSelectionGenerator(
                    startNode,
                    execDef.selection.startOffset,
                    endNode,
                    execDef.selection.endOffset,
                    actingRoot
                ),
                serializer = new RTEExt.rte.selection.pipeline.HtmlSelectionSerializer(actingRoot),
                pipeline = new RTEExt.rte.selection.pipeline.Pipeline(generator, serializer),
                stylingHandler = new RTEExt.rte.selection.pipeline.StylingHandler(stylingTagName);


            //normalize serialization
            serializer.normalizeWith(function(documentFragment){
                RTEExt.rte.Utils.normalize(
                    documentFragment,
                    function(node){
                        return !RTEExt.rte.Utils.isContainerNode(node)
                            && !RTEExt.rte.Utils.isStylingContainerNode(node, stylingTagName)
                            && !RTEExt.rte.Utils.isIgnoredNode(node);
                    }
                );
            });

            //don't purge empty styling tags if we are applying the tag
            stylingHandler.setKeepEmptyStylingTag(execDef.value.applyTag);

            //add transformer
            pipeline.addTransformer(stylingHandler);

            //style
            pipeline.run();
        }
    });

    RTEExt.rte.commands.FormatExt.COMMAND_NAME = COMMAND_NAME;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.FormatExt
    );
})(window.CUI);
