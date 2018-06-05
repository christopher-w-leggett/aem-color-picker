RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    var GROUP = 'colors',
        COMMAND_NAME = 'text-highlight',
        COMMAND_REF = GROUP + '#' + COMMAND_NAME,
        TOOLTIP_KEYS = {
            'title': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.title',
            'text': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.text'
        };

    RTEExt.rte.commands.TextHighlight = new Class({
        toString: 'TextHighlight',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
        },

        execute: function(execDef){
            var stylingTagName = 'mark',
                styles = {'background-color': execDef.value},
                startNode = execDef.selection.startNode,
                endNode = execDef.selection.endNode,
                root = execDef.editContext.root,
                actingRoot = RTEExt.rte.Utils.getCommonAncestor(startNode, endNode, root, function(node){
                    return node.tagName
                        && (RTEExt.rte.Utils.isContainerNode(node)
                            || RTEExt.rte.Utils.isStylingContainerNode(node, stylingTagName));
                }),
                generator = new RTEExt.rte.selection.pipeline.HtmlSelectionGenerator(
                    startNode,
                    execDef.selection.startOffset,
                    endNode,
                    execDef.selection.endOffset,
                    actingRoot
                ),
                serializer = new RTEExt.rte.selection.pipeline.HtmlSelectionSerializer(
                    actingRoot,
                    function(documentFragment){
                        RTEExt.rte.Utils.normalize(
                            documentFragment,
                            function(node){
                                return !RTEExt.rte.Utils.isContainerNode(node)
                                    && !RTEExt.rte.Utils.isStylingContainerNode(node, stylingTagName)
                                    && !RTEExt.rte.Utils.isIgnoredNode(node);
                            }
                        );
                    }
                ),
                pipeline = new RTEExt.rte.selection.pipeline.Pipeline(generator, serializer);

            //add transformer
            pipeline.addTransformer(new RTEExt.rte.selection.pipeline.StylingHandler(
                stylingTagName, styles
            ));

            //style
            pipeline.run();
        }
    });

    RTEExt.rte.commands.TextHighlight.COMMAND_NAME = COMMAND_NAME;
    RTEExt.rte.commands.TextHighlight.COMMAND_REF = COMMAND_REF;
    RTEExt.rte.commands.TextHighlight.TOOLTIP_KEYS = TOOLTIP_KEYS;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.TextHighlight
    );
})(window.CUI);
