RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    var GROUP = 'auto',
        COMMAND_NAME = 'inline';

    RTEExt.rte.commands.AutoInlineFormatting = new Class({
        toString: 'AutoInlineFormatting',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK;
        },

        execute: function(execDef){
            var stylingTagName = execDef.value.format.tagName,
                startNode = execDef.value.startNode,
                endNode = execDef.value.endNode,
                root = execDef.editContext.root,
                actingRoot = RTEExt.rte.Utils.getCommonAncestor(startNode, endNode, root, function(node){
                    return node.tagName && RTEExt.rte.Utils.isContainerNode(node);
                }),
                generator = new RTEExt.rte.selection.pipeline.HtmlSelectionGenerator(
                    startNode,
                    execDef.value.startOffset,
                    endNode,
                    execDef.value.endOffset,
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

            //don't purge empty styling tags
            stylingHandler.setKeepEmptyStylingTag(true);

            //add transformers
            pipeline.addTransformer(new RTEExt.rte.selection.pipeline.ContentTrimmingHandler(
                execDef.value.format.charPattern, execDef.value.format.charPattern
            ));
            pipeline.addTransformer(stylingHandler);

            //style
            pipeline.run();

            //update bookmark
            execDef.bookmark.startPos -= (execDef.value.format.charPattern.length * 2);
        }
    });

    RTEExt.rte.commands.AutoInlineFormatting.COMMAND_NAME = COMMAND_NAME;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.AutoInlineFormatting
    );
})(window.CUI);
