RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
//TODO: Don't allow nested mark tags
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
            if(RTEExt.rte.Utils.isRangeSelection(execDef.selection)){
                var styler = new RTEExt.rte.MarkupStyler('mark');
                styler.style(execDef.selection, {'background-color': execDef.value}, execDef.editContext.root);
            }
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
