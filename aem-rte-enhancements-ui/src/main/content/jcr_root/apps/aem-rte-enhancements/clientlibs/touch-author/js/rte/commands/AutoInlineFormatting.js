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
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
        },

        execute: function(execDef){
            var stylingTagName = execDef.value.format.tagName,
                startNode = execDef.value.startNode,
                endNode = execDef.value.endNode,
                root = execDef.editContext.root,
                range = CUI.rte.Selection.saveNativeSelection(execDef.editContext)
                    || CUI.rte.Selection.getLeadRange(execDef.editContext),
                actingRoot = RTEExt.rte.Utils.getCommonAncestor(startNode, endNode, root, function(node){
                    return node.tagName
                        && (RTEExt.rte.Utils.isContainerNode(node)
                            || RTEExt.rte.Utils.isStylingContainerNode(node, stylingTagName));
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



            //TODO: need to get selection working.
            // provide correct selection/nodeList parameters
//            execDef.selection = execDef.component.createQualifiedSelection(execDef.editContext);
//            execDef.nodeList = CUI.rte.DomProcessor.createNodeList(execDef.editContext, execDef.selection);

//            var bookmark = execDef.bookmark;
//            CUI.rte.Selection.setCaretPos(execDef.editContext, 2);
//            var positionDef = this._moveBack(execDef.selection.startNode, execDef.selection.startOffset, 2);
//            if(positionDef){
//                range.setStart(positionDef.textNode, positionDef.offset);
//                range.setEnd(positionDef.textNode, positionDef.offset);
////                selection.startNode = positionDef.textNode;
////                selection.startOffset = positionDef.offset;
//                selection.startOffset -= 2;
//                bookmark = CUI.rte.Selection.bookmarkFromProcessingSelection(execDef.editContext, {
//                    startNode: positionDef.textNode,
//                    startOffset: positionDef.offset
//                });
            }
//            console.log(CUI.rte.Selection.getCaretPos(execDef.editContext));
//            CUI.rte.Selection.selectRange(execDef.editContext, range);
//            execDef.bookmark = bookmark;
//            execDef.selection = selection;
//
//            return {
//                "calleeRet": {
//                    "bookmark": bookmark,
//                    "selection": selection,
//                    "geckoEnsureCaretVisibility": true
//                }
//            };
        }
    });

    RTEExt.rte.commands.AutoInlineFormatting.COMMAND_NAME = COMMAND_NAME;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.AutoInlineFormatting
    );
})(window.CUI);
