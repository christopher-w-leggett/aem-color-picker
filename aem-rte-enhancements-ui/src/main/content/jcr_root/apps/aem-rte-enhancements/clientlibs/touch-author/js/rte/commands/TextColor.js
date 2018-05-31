RTEExt = window.RTEExt || {};
RTEExt.rte = RTEExt.rte || {};
RTEExt.rte.commands = RTEExt.rte.commands || {};
(function(CUI){
    "use strict";

    var GROUP = 'colors',
        COMMAND_NAME = 'text-color',
        COMMAND_REF = GROUP + '#' + COMMAND_NAME,
        TOOLTIP_KEYS = {
            'title': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.title',
            'text': 'plugins.' + GROUP + '.' + COMMAND_NAME + '.text'
        };

    RTEExt.rte.commands.TextColor = new Class({
        toString: 'TextColor',

        extend: CUI.rte.commands.Command,

        isCommand: function(cmdStr){
            return cmdStr.toLowerCase() === COMMAND_NAME;
        },

        getProcessingOptions: function(){
            var cmd = CUI.rte.commands.Command;
            return cmd.PO_BOOKMARK | cmd.PO_SELECTION | cmd.PO_NODELIST;
        },

        execute: function(execDef){
            var styler = new RTEExt.rte.MarkupStyler('span');
            styler.style(execDef.selection, {'color': execDef.value}, execDef.editContext.root);
        }
    });

    RTEExt.rte.commands.TextColor.COMMAND_NAME = COMMAND_NAME;
    RTEExt.rte.commands.TextColor.COMMAND_REF = COMMAND_REF;
    RTEExt.rte.commands.TextColor.TOOLTIP_KEYS = TOOLTIP_KEYS;

    //register command
    CUI.rte.commands.CommandRegistry.register(
        COMMAND_NAME, RTEExt.rte.commands.TextColor
    );
})(window.CUI);
